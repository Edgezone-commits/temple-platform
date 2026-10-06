"""
The tools the "Ask the Pandit" agent can call.

The docstring of each tool is what the model reads to decide whether to call
it, so they are written for that audience: what the tool answers, when to
reach for it, and what the arguments mean. Keep them concrete.

Safety rules that apply to every tool here
------------------------------------------
  • Read-only. No tool inserts, updates or deletes anything. The booking tool
    explains how to book; it cannot make a booking.
  • Public rows only. Every query filters on the table's own visibility flag
    (is_published / is_available), so an unpublished draft can never be quoted.
  • No personal data. Nothing touches profiles, pooja_bookings, chat_history
    or auth.users, so a devotee can't be talked into leaking another's booking.
  • Arguments are validated and clamped, never passed through raw.
  • Every tool catches its own errors and returns a short sentence instead of
    raising, so one unavailable table can't take the whole chat down.

Column and table names come from database/schema_v2.sql.
"""
from __future__ import annotations

import logging
import time
from contextlib import contextmanager
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import date, timedelta

from langchain_core.tools import tool

from .config import RagConfig
from .store import KnowledgeStore

log = logging.getLogger(__name__)

UNAVAILABLE = "That information is unavailable right now."
NOTHING_FOUND = "Nothing was found for that."

# Argument clamps. A model that misunderstands an argument should produce a
# small useless query, not a table scan.
MAX_QUERY_CHARS = 100
MAX_DATE_SPAN_DAYS = 90
MAX_ROWS = 25

CALENDAR_KINDS = {"festival", "ekadashi", "purnima", "amavasya", "sankranti", "special_pooja", "other"}
INFO_TOPICS = {"timings", "contact", "history", "rituals", "general"}


# --------------------------------------------------------------------- helpers
def _clip(text: object, limit: int = MAX_QUERY_CHARS) -> str:
    return str(text or "").strip()[:limit]


def _both(en: object, ne: object) -> str:
    """English and Nepali together, so either language's answer can quote it."""
    return " / ".join(str(x) for x in (en, ne) if x)


def _money(value: object, currency: object = "NPR") -> str:
    if value is None or value == "":
        return "price on request"
    try:
        return f"{currency or 'NPR'} {float(value):,.0f}"
    except (TypeError, ValueError):
        return "price on request"


def _parse_date(raw: object, fallback: date) -> date:
    """Accept 'YYYY-MM-DD' (what the model is told to send); fall back quietly."""
    try:
        return date.fromisoformat(str(raw)[:10])
    except (TypeError, ValueError):
        return fallback


@dataclass
class ToolCallRecord:
    """One tool invocation, for logging and for the eval harness."""
    tool: str
    args: dict
    ok: bool
    ms: int


@dataclass
class ToolContext:
    """
    Shared state for one question.

    `sources` accumulates the passages search_temple_knowledge returned, in
    citation order, so finalize() can turn the model's [n] markers into real
    source links. `trace` records every call for logging and the evals.
    """
    cfg: RagConfig
    store: KnowledgeStore | None = None
    sources: list[dict] = field(default_factory=list)
    trace: list[ToolCallRecord] = field(default_factory=list)
    # Pass a client in to reuse one, or to substitute a stand-in (the eval
    # harness does this so its offline mode can still exercise these tools).
    # Left None, one is built lazily from cfg on first use.
    supabase_client: object | None = None
    _tried: bool = False

    def supabase(self):
        """Service-role client; None when Supabase isn't configured."""
        if self.supabase_client is None and not self._tried:
            self._tried = True
            if self.cfg.supabase_url and self.cfg.supabase_service_key:
                try:
                    from supabase import create_client
                    self.supabase_client = create_client(
                        self.cfg.supabase_url, self.cfg.supabase_service_key)
                except Exception as e:
                    log.warning("tools: Supabase client unavailable: %s", e)
        return self.supabase_client

    def record(self, name: str, args: dict, ok: bool, started: float) -> None:
        ms = int((time.perf_counter() - started) * 1000)
        self.trace.append(ToolCallRecord(tool=name, args=args, ok=ok, ms=ms))
        # Argument SIZES, not contents: a devotee's question is not log material.
        log.info("tool %s ok=%s %sms args=%s", name, ok, ms,
                 {k: len(str(v)) for k, v in args.items()})


# --------------------------------------------------------------- active context
# The graph is compiled once at import, so the tools below are module-level
# singletons — but each question needs its own citation list and trace. A
# ContextVar gives us that without rebuilding the graph: it is set around each
# answer() call and is naturally per-thread (FastAPI runs sync endpoints in a
# threadpool), so two concurrent devotees never share state.
_ACTIVE: ContextVar[ToolContext | None] = ContextVar("temple_rag_tool_ctx", default=None)


@contextmanager
def active_context(ctx: ToolContext):
    token = _ACTIVE.set(ctx)
    try:
        yield ctx
    finally:
        _ACTIVE.reset(token)


def current_context() -> ToolContext | None:
    """The ToolContext for the question being answered on this thread, if any."""
    return _ACTIVE.get()


def _ctx() -> ToolContext:
    ctx = _ACTIVE.get()
    if ctx is None:                 # a tool called outside answer() is a bug
        raise RuntimeError("temple_rag tool called with no active ToolContext")
    return ctx


def _run(name: str, args: dict, body) -> str:
    """Time a tool, record it, and turn any error into a safe sentence."""
    ctx = _ctx()
    started = time.perf_counter()
    try:
        out = body(ctx)
    except Exception as e:
        log.warning("tool %s failed: %s", name, e)
        ctx.record(name, args, False, started)
        return UNAVAILABLE
    ctx.record(name, args, True, started)
    return out


# ----------------------------------------------------------------------- tools
@tool
def search_temple_knowledge(query: str) -> str:
    """Search the temple's own written knowledge base and return matching passages.

    Use it for the temple's history and tradition, the scriptures and stotras in
    the library, the meaning and significance of a ritual, and anything that
    reads like a question about belief or philosophy at this temple.

    This is the fallback, NOT the first choice. One of the others is almost
    always better, and they return the authoritative version of the same fact:
      • opening hours, address, phone, email, what to wear, what to bring,
        footwear, dress code, temple rules and etiquette → get_temple_info
      • anything tied to a date → get_calendar_events
      • prices and durations → get_pooja_info
      • how to book → get_booking_help
    Reach for this one when none of those covers the question, or to add
    background to an answer you have already grounded with one of them.

    Each result is numbered. Cite the number in your answer as [1], [2] and so
    on. Returns a note saying nothing was found when no passage is relevant — in
    that case say you don't have the information; do not fill the gap yourself.

    Args:
        query: What to look for, in the devotee's own language (English or
            Nepali both work). A short phrase retrieves better than a sentence.
    """
    args = {"query": _clip(query)}

    def body(ctx: ToolContext) -> str:
        if not args["query"]:
            return NOTHING_FOUND
        if ctx.store is None:
            return UNAVAILABLE
        hits = ctx.store.search(args["query"])
        if not hits:
            return ("No passage in the temple's knowledge base matches that. Tell "
                    "the devotee you don't have that information and suggest "
                    "contacting the temple.")
        out = []
        for h in hits:
            # Numbering continues across calls, so [n] stays unique per answer.
            ctx.sources.append({"n": len(ctx.sources) + 1, "title": h.title,
                                "type": h.source_type, "url": h.url})
            out.append(f"[{len(ctx.sources)}] {h.title}\n{h.text}")
        return "\n\n".join(out)

    return _run("search_temple_knowledge", args, body)


@tool
def get_calendar_events(date_from: str, date_to: str, kind: str = "") -> str:
    """Look up festivals and observances in the temple calendar for a date range.

    Use this for anything anchored to a date: "what festival is tomorrow", "when
    is the next Ekadashi", "what's on in Kartik", "भोलि कुन पर्व छ?". Today's
    date is given to you with the question, so work the range out from that
    rather than guessing the year.

    Returns each observance with its Gregorian date, its Bikram Sambat (BS) date
    when recorded, the tithi, and a short description.

    Args:
        date_from: First day to include, as YYYY-MM-DD.
        date_to: Last day to include, as YYYY-MM-DD. At most 90 days after
            date_from; a longer range is trimmed to 90 days.
        kind: Optional filter, one of: festival, ekadashi, purnima, amavasya,
            sankranti, special_pooja, other. Leave empty for all of them.
    """
    today = date.today()
    start = _parse_date(date_from, today)
    end = _parse_date(date_to, start)
    if end < start:
        start, end = end, start
    end = min(end, start + timedelta(days=MAX_DATE_SPAN_DAYS))
    args = {"date_from": start.isoformat(), "date_to": end.isoformat(), "kind": _clip(kind, 20)}

    def body(ctx: ToolContext) -> str:
        sb = ctx.supabase()
        if sb is None:
            return UNAVAILABLE
        q = (sb.table("calendar_events")
             .select("event_date, end_date, category, title_en, title_ne, tithi_en, tithi_ne, "
                     "bs_date_en, bs_date_ne, description_en, description_ne, is_major")
             .eq("is_published", True)
             .gte("event_date", start.isoformat())
             .lte("event_date", end.isoformat()))
        if args["kind"] and args["kind"].lower() in CALENDAR_KINDS:
            q = q.eq("category", args["kind"].lower())
        rows = q.order("event_date").limit(MAX_ROWS).execute().data or []
        if not rows:
            return f"No observances are recorded between {start.isoformat()} and {end.isoformat()}."
        lines = [f"Temple calendar, {start.isoformat()} to {end.isoformat()} "
                 f"(Gregorian dates; BS = Bikram Sambat):"]
        for r in rows:
            d = str(r.get("event_date"))[:10]
            span = d
            if r.get("end_date") and str(r["end_date"])[:10] != d:
                span = f"{d} to {str(r['end_date'])[:10]}"
            bs = _both(r.get("bs_date_en"), r.get("bs_date_ne"))
            tithi = _both(r.get("tithi_en"), r.get("tithi_ne"))
            desc = r.get("description_en") or r.get("description_ne") or ""
            lines.append(
                f"- {span}"
                + (f" (BS {bs})" if bs else "")
                + f": {_both(r.get('title_en'), r.get('title_ne'))} [{r.get('category')}]"
                + (f" — {tithi}" if tithi else "")
                + (f". {desc}" if desc else "")
                + (" (major observance)" if r.get("is_major") else "")
            )
        return "\n".join(lines)

    return _run("get_calendar_events", args, body)


@tool
def get_pooja_info(name_or_keyword: str = "") -> str:
    """Look up the poojas and archanas the temple offers, with prices and durations.

    Use this whenever a price, a duration or the list of available sevas is asked
    for — "how much is Abhishekam?", "what poojas can I book?", "अभिषेकम्‌को
    शुल्क कति?". Covers both poojas and archanas.

    Does NOT book anything. For how to book, call get_booking_help.

    Args:
        name_or_keyword: Part of a pooja or archana name to match, e.g.
            "abhishekam". Leave empty to list everything on offer.
    """
    args = {"name_or_keyword": _clip(name_or_keyword)}

    def body(ctx: ToolContext) -> str:
        sb = ctx.supabase()
        if sb is None:
            return UNAVAILABLE
        kw = args["name_or_keyword"].lower()
        lines: list[str] = []

        poojas = (sb.table("poojas")
                  .select("name_en, name_ne, description_en, description_ne, "
                          "duration_minutes, price, currency")
                  .eq("is_available", True).order("sort_order")
                  .limit(MAX_ROWS).execute().data or [])
        for r in poojas:
            name = _both(r.get("name_en"), r.get("name_ne"))
            if kw and kw not in name.lower():
                continue
            lines.append(
                f"- Pooja: {name} — {_money(r.get('price'), r.get('currency'))}"
                + (f", about {r['duration_minutes']} minutes" if r.get("duration_minutes") else "")
                + (f". {r['description_en']}" if r.get("description_en") else "")
            )

        archanas = (sb.table("archanas")
                    .select("name_en, name_ne, deity_en, deity_ne, price, currency")
                    .eq("is_available", True).order("sort_order")
                    .limit(MAX_ROWS).execute().data or [])
        for r in archanas:
            name = _both(r.get("name_en"), r.get("name_ne"))
            if kw and kw not in name.lower():
                continue
            deity = _both(r.get("deity_en"), r.get("deity_ne"))
            lines.append(f"- Archana: {name}" + (f" (deity: {deity})" if deity else "")
                         + f" — {_money(r.get('price'), r.get('currency'))}")

        if not lines:
            return (f"No pooja or archana matching '{args['name_or_keyword']}' is on offer."
                    if kw else "No poojas are listed as available right now.")
        return ("Poojas and archanas offered at the temple. Payment is made at the "
                "temple on the day; booking is at /poojas/book.\n" + "\n".join(lines))

    return _run("get_pooja_info", args, body)


@tool
def get_temple_info(topic: str = "") -> str:
    """Look up the temple's practical facts: opening hours, address, contact, rules.

    This is the authoritative source for all of the following — quote it exactly,
    especially times, addresses and phone numbers:
      • darshan and aarti timings, when the temple opens, closes, or breaks
        ("what time is morning aarti?", "मन्दिर कति बजे खुल्छ?")
      • where the temple is, and its phone and email
      • temple etiquette: what to wear, the dress code, what to bring, and
        whether footwear is allowed inside
      • the booking policy, such as how far in advance a pooja must be booked

    Prefer this over search_temple_knowledge for any of the above.

    Args:
        topic: Which group of facts to return, one of: timings, contact, history,
            rituals. Dress code, footwear and what to bring are under 'rituals'.
            Anything else, or empty, returns all of them.
    """
    args = {"topic": _clip(topic, 20)}

    def body(ctx: ToolContext) -> str:
        sb = ctx.supabase()
        if sb is None:
            return UNAVAILABLE
        q = sb.table("temple_info").select("key, category, value_en, value_ne")
        if args["topic"] and args["topic"].lower() in INFO_TOPICS:
            q = q.eq("category", args["topic"].lower())
        rows = q.order("category").order("sort_order").limit(MAX_ROWS * 2).execute().data or []
        if not rows:
            return NOTHING_FOUND
        lines = ["Temple information (quote times, addresses and phone numbers "
                 "exactly as written):"]
        for r in rows:
            lines.append(f"- [{r.get('category')}] {r.get('key')}: "
                         f"{_both(r.get('value_en'), r.get('value_ne'))}")
        return "\n".join(lines)

    return _run("get_temple_info", args, body)


@tool
def get_booking_help() -> str:
    """Explain how a devotee books a pooja, and give them the booking page link.

    Use this for "how do I book?", "can you book it for me?", "पूजा कसरी बुक
    गर्ने?", or any question about what happens after booking (payment,
    confirmation, what to bring).

    You cannot create, change or cancel a booking yourself — this tool only
    returns the instructions. Never tell a devotee their booking is made.
    """
    args: dict = {}

    def body(ctx: ToolContext) -> str:
        steps = [
            "How a devotee books a pooja on this website:",
            "1. Open the booking page at /poojas/book (the 'Book a Pooja' button in the menu).",
            "2. Choose the pooja or archana from the list — the price is shown beside each one.",
            "3. Pick a date and a time slot.",
            "4. Fill in name and phone number. Email is optional.",
            "5. Optionally add gothram, nakshatra and rashi, which the priest uses "
            "during the sankalpam.",
            "6. Submit. The request goes to the temple office, which confirms it by phone.",
            "Payment is made at the temple on the day of the pooja; no advance "
            "payment is taken online.",
            "The assistant cannot make, change or cancel a booking — only the "
            "temple office can.",
        ]
        # The booking policy lives in temple_info, so quote it when it's there
        # rather than restating it from memory.
        sb = ctx.supabase()
        if sb is not None:
            try:
                rows = (sb.table("temple_info").select("key, value_en, value_ne")
                        .eq("category", "rituals").order("sort_order")
                        .limit(10).execute().data or [])
                if rows:
                    steps.append("Temple booking policy:")
                    steps += [f"- {r.get('key')}: {_both(r.get('value_en'), r.get('value_ne'))}"
                              for r in rows]
            except Exception as e:
                log.warning("get_booking_help: could not read booking policy: %s", e)
        return "\n".join(steps)

    return _run("get_booking_help", args, body)


# Order matters only for readability; the model picks by docstring.
TOOLS = [search_temple_knowledge, get_calendar_events, get_pooja_info,
         get_temple_info, get_booking_help]

TOOL_NAMES = [t.name for t in TOOLS]
