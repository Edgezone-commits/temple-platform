"""
A scripted chat model for offline tests and the eval harness's --offline mode.

It is NOT a simulation of Gemini's judgement — it replays a list of replies you
hand it, so it can exercise the graph (routing, tool execution, citation
extraction, the round cap) with no API key, no network and no cost. Anything
that depends on the real model actually choosing well has to be measured
online; see docs/AGENT.md.
"""
from __future__ import annotations

import re
from typing import Any, Optional, Sequence

from langchain_core.callbacks import CallbackManagerForLLMRun
from langchain_core.language_models import BaseChatModel
from langchain_core.messages import AIMessage, BaseMessage
from langchain_core.outputs import ChatGeneration, ChatResult


def ai(text: str = "", tool_calls: Sequence[dict] | None = None,
       input_tokens: int = 100, output_tokens: int = 20) -> AIMessage:
    """Build one scripted reply. `tool_calls` items are {name, args}."""
    calls = [{"name": c["name"], "args": c.get("args", {}), "id": f"call_{i}"}
             for i, c in enumerate(tool_calls or [])]
    return AIMessage(
        content=text,
        tool_calls=calls,
        usage_metadata={"input_tokens": input_tokens, "output_tokens": output_tokens,
                        "total_tokens": input_tokens + output_tokens},
    )


def _fresh(message: AIMessage) -> AIMessage:
    """
    A copy with a new id.

    LangGraph's add_messages reducer deduplicates by message id, so handing out
    the same AIMessage object twice would overwrite the first instead of
    appending — which silently shortens the conversation. Emitting a fresh copy
    each time makes `[reply] * 3` behave the way a reader expects.
    """
    return message.model_copy(update={"id": None})


class ScriptedChatModel(BaseChatModel):
    """Returns `replies` in order; repeats the last one once exhausted."""

    replies: list[AIMessage] = []
    calls: list[list[BaseMessage]] = []

    def __init__(self, replies: Sequence[AIMessage] | None = None, **kw: Any):
        super().__init__(replies=list(replies or [ai("(no reply scripted)")]), calls=[], **kw)

    @property
    def _llm_type(self) -> str:
        return "scripted"

    def bind_tools(self, tools: Sequence[Any], **kw: Any):  # type: ignore[override]
        # The script already encodes which tools get called, so binding is a
        # no-op — but it must exist, because the graph calls it.
        return self

    def _generate(
        self,
        messages: list[BaseMessage],
        stop: Optional[list[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kw: Any,
    ) -> ChatResult:
        self.calls.append(list(messages))
        i = min(len(self.calls) - 1, len(self.replies) - 1)
        return ChatResult(generations=[ChatGeneration(message=_fresh(self.replies[i]))])


def _hit(keyword: str, question: str) -> bool:
    """
    Match a keyword, respecting word boundaries for Latin script.

    Plain `in` matching meant "Sudarshana Homam" contained "darshan" and so was
    treated as a timings question. Devanagari has no \\b word boundaries that
    Python's re recognises, so those keywords stay substring matches — which is
    what we want for an agglutinative script anyway.
    """
    if keyword.isascii():
        return re.search(rf"\b{re.escape(keyword)}", question) is not None
    return keyword in question


_MONTHS = {m: i for i, m in enumerate(
    ["january", "february", "march", "april", "may", "june", "july", "august",
     "september", "october", "november", "december"], 1)}


def _date_range(question: str) -> dict:
    """
    Pull a crude date range out of the question.

    The real model works this out from "Today is <date>" plus the question. This
    stand-in handles the two shapes the eval cases use — an explicit month+year,
    or a day+month+year — and otherwise falls back to the next 60 days. It is a
    stub, not a date parser.
    """
    from datetime import date, timedelta

    q = question.lower()
    year = None
    if y := re.search(r"\b(20\d\d)\b", q):
        year = int(y.group(1))
    # also accept a Devanagari year, e.g. २०२६
    if year is None and (y := re.search(r"[०-९]{4}", question)):
        year = int(y.group(0).translate(str.maketrans("०१२३४५६७८९", "0123456789")))

    month = next((n for name, n in _MONTHS.items() if name in q), None)
    if year and month:
        start = date(year, month, 1)
        end = date(year + (month == 12), (month % 12) + 1, 1) - timedelta(days=1)
        return {"date_from": start.isoformat(), "date_to": end.isoformat()}

    today = date.today()
    return {"date_from": today.isoformat(), "date_to": (today + timedelta(days=60)).isoformat()}


class KeywordChatModel(ScriptedChatModel):
    """
    Picks a tool from keywords in the question, then answers with a citation.

    Used by the eval harness's --offline mode so the harness itself can be
    tested end to end. Its tool choice is a hand-written rule, so offline
    tool-selection numbers say nothing about how well Gemini chooses.
    """

    # Order matters: the first rule that matches wins. Note how crude this is —
    # that is the point. It exists to drive the graph, not to imitate judgement.
    # Bare "कति" ("how much" / "how many") is deliberately NOT a price keyword,
    # because it appears in timing and booking questions just as often.
    RULES: list[tuple[tuple[str, ...], str]] = [
        (("festival", "ekadashi", "purnima", "tomorrow", "calendar", "falls on",
          "observance", "पर्व", "एकादशी", "पूर्णिमा", "भोलि", "पात्रो", "तारेख"),
         "get_calendar_events"),
        (("time", "timing", "open", "close", "aarti", "darshan", "address", "located",
          "where is", "phone", "contact", "email", "dress", "wear", "attire", "bring",
          "footwear", "shoes", "every day", "year",
          "समय", "खुल्", "बन्द", "दर्शन", "बजे", "ठेगाना", "फोन", "सम्पर्क", "इमेल",
          "ल्याउनु", "जुत्ता", "पोशाक", "वर्षभरि", "अवस्थित"), "get_temple_info"),
        (("book", "booking", "reserve", "advance", "payment", "pay",
          "बुक", "आरक्षण", "अगाडि", "भुक्तानी"), "get_booking_help"),
        (("price", "cost", "how much", "how long", "npr", "duration", "take",
          "pooja list", "archana", "शुल्क", "मूल्य", "अर्चना"), "get_pooja_info"),
    ]

    def _generate(self, messages, stop=None, run_manager=None, **kw) -> ChatResult:
        self.calls.append(list(messages))
        # Second visit in the same question: answer rather than call again.
        already_called = any(getattr(m, "tool_calls", None) for m in messages)
        # Match on the question ALONE. The surrounding message also carries
        # "Today is <date> (Nepal time)", and matching that made the word "time"
        # appear in every question, so rule 1 won every case.
        question = ""
        for m in messages:
            found = re.search(r"<devotee_question>\s*(.*?)\s*</devotee_question>",
                              str(m.content), re.DOTALL)
            if m.type == "human" and found:
                question = found.group(1)
        q = question.lower()

        if not already_called:
            for keywords, name in self.RULES:
                if any(_hit(k, q) for k in keywords):
                    args: dict = {}
                    if name == "get_calendar_events":
                        args = _date_range(q)
                    elif name == "search_temple_knowledge":
                        args = {"query": q[:80]}
                    elif name == "get_pooja_info":
                        args = {"name_or_keyword": ""}
                    elif name == "get_temple_info":
                        args = {"topic": ""}
                    return ChatResult(generations=[ChatGeneration(
                        message=ai(tool_calls=[{"name": name, "args": args}]))])
            return ChatResult(generations=[ChatGeneration(message=ai(
                tool_calls=[{"name": "search_temple_knowledge", "args": {"query": q[:80]}}]))])

        # Echo the tool output back as the "answer" so must_contain checks can
        # exercise the harness. A citation is added when one was offered.
        tool_text = ""
        for m in reversed(messages):
            if m.type == "tool":
                tool_text = str(m.content)
                break
        cite = " [1]" if "[1]" in tool_text else ""
        # Echo the whole tool result. A shorter cap silently dropped the last
        # temple_info rows (footwear, dress code), which the real model reads.
        return ChatResult(generations=[ChatGeneration(
            message=ai(text=f"{tool_text[:8000]}{cite}"))])
