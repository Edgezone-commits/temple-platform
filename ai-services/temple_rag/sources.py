"""
Turn the temple's content into knowledge-base chunks.

Sources (each becomes one or more Chunk objects):
  • temple_info      — timings, contact, rituals, booking policy (bilingual)
  • books            — title/author/description + full PDF text when pdf_url is set
  • poojas, archanas — names, prices, durations (so the assistant can help with booking)
  • calendar_events  — upcoming festivals / Ekadashi / Purnima (next ~12 months)
  • events           — upcoming temple programmes
  • knowledge_base/  — any .pdf / .md / .txt files placed there (scriptures, notes)

Rows are read from Supabase with the service-role key (server-side only).
Each source also gets a content hash so unchanged sources are skipped.
"""
from __future__ import annotations

import hashlib
import io
import logging
from dataclasses import dataclass, field
from datetime import date, timedelta
from pathlib import Path

from .chunking import chunk_text, normalize
from .config import RagConfig
from .store import Chunk

log = logging.getLogger(__name__)


@dataclass
class Source:
    source_type: str
    source_key: str
    title: str
    text: str
    lang: str = ""
    url: str = ""
    source_id: str | None = None          # DB row id (for kb_documents)
    source_path: str | None = None        # file path (for kb_documents)
    chunks: list[Chunk] = field(default_factory=list)

    @property
    def content_hash(self) -> str:
        return hashlib.sha256(f"{self.title}\n{self.url}\n{self.text}".encode("utf-8")).hexdigest()

    def to_chunks(self, cfg: RagConfig) -> list[Chunk]:
        parts = chunk_text(self.text, cfg.chunk_chars, cfg.chunk_overlap)
        return [Chunk(id=f"{self.source_key}#{i}", text=p, source_type=self.source_type, source_key=self.source_key,
                      title=self.title, lang=self.lang, url=self.url) for i, p in enumerate(parts)]


INFO_HEADINGS = {
    "timings": "Temple opening hours and darshan timings — when the temple opens and closes (मन्दिर खुल्ने र बन्द हुने समय, दर्शन समय).",
    "contact": "Temple contact details — phone number, email and address (मन्दिरको सम्पर्क: फोन नम्बर, इमेल, ठेगाना).",
    "history": "History and tradition of the temple (मन्दिरको इतिहास र परम्परा).",
    "rituals": "Rituals, pooja booking rules and temple etiquette (अनुष्ठान, पूजा बुकिङ नियम र मन्दिरका नियम).",
    "general": "General information about Shree Laxminarayan Mandir (मन्दिरबारे सामान्य जानकारी).",
}


def _both(en: str | None, ne: str | None) -> str:
    """Bilingual line: English and Nepali together so either language retrieves it."""
    return " / ".join(x for x in (en, ne) if x)


def _money(v, cur="NPR") -> str:
    if v is None:
        return ""
    return f"{cur} {float(v):,.0f}"


# ---------------------------------------------------------------- database rows
def rows_to_sources(tables: dict[str, list[dict]], today: date | None = None) -> list[Source]:
    """Pure function (easy to test): table name → rows  ⇒  list of Sources."""
    today = today or date.today()
    horizon = today + timedelta(days=370)
    out: list[Source] = []

    for r in tables.get("temple_info", []):
        # Descriptive heading so short facts ("+977-…") match natural questions ("phone number?").
        heading = INFO_HEADINGS.get(r.get("category", ""), INFO_HEADINGS["general"])
        text = normalize(f"{heading}\n{r['key']}:\nEnglish: {r.get('value_en') or ''}\nनेपाली: {r.get('value_ne') or ''}")
        out.append(Source("temple_info", f"temple_info:{r['id']}", f"Temple info – {r['key']}", text, "en+ne", source_id=r["id"]))

    for r in tables.get("books", []):
        if not r.get("is_published", True):
            continue
        head = (f"Book: {_both(r.get('title_en'), r.get('title_ne'))}\n"
                f"Author: {_both(r.get('author_en'), r.get('author_ne')) or 'unknown'}\n"
                f"Category: {r.get('category') or ''}; language: {r.get('language') or ''}\n"
                f"{r.get('description_en') or ''}\n{r.get('description_ne') or ''}")
        out.append(Source("book", f"book:{r['id']}", r.get("title_en") or "Book", normalize(head + "\n\n" + (r.get("_pdf_text") or "")),
                          r.get("language") or "", r.get("pdf_url") or "", source_id=r["id"]))

    lines = []
    for r in tables.get("poojas", []):
        if not r.get("is_available", True):
            continue
        lines.append(f"- {_both(r.get('name_en'), r.get('name_ne'))}: {_money(r.get('price'), r.get('currency') or 'NPR')}"
                     f"{', ' + str(r['duration_minutes']) + ' minutes' if r.get('duration_minutes') else ''}. "
                     f"{r.get('description_en') or ''} {r.get('description_ne') or ''}")
    for r in tables.get("archanas", []):
        if not r.get("is_available", True):
            continue
        lines.append(f"- Archana: {_both(r.get('name_en'), r.get('name_ne'))} (deity: {_both(r.get('deity_en'), r.get('deity_ne'))}): "
                     f"{_money(r.get('price'), r.get('currency') or 'NPR')}")
    if lines:
        text = ("Pooja and archana services offered at the temple, with prices (payment is made at the temple). "
                "Devotees can book online on the website at /poojas/book.\n" + "\n".join(lines))
        out.append(Source("pooja", "poojas:all", "Pooja & archana services / पूजा सेवाहरू", text, "en+ne", "/poojas"))

    cal = []
    for r in sorted(tables.get("calendar_events", []), key=lambda r: r["event_date"]):
        if not r.get("is_published", True):
            continue
        d = date.fromisoformat(str(r["event_date"])[:10])
        end = date.fromisoformat(str(r["end_date"])[:10]) if r.get("end_date") else d
        if end < today or d > horizon:
            continue
        span = f"{d.isoformat()} ({d.strftime('%A')})" + (f" to {end.isoformat()}" if end != d else "")
        cal.append(f"- {span}: {_both(r.get('title_en'), r.get('title_ne'))} [{r.get('category')}]"
                   f"{' — ' + _both(r.get('tithi_en'), r.get('tithi_ne')) if r.get('tithi_en') or r.get('tithi_ne') else ''}. "
                   f"{r.get('description_en') or ''}")
    if cal:
        # one source per ~month so retrieval can pick the relevant period
        for i in range(0, len(cal), 12):
            part = cal[i:i + 12]
            out.append(Source("calendar", f"calendar:{i // 12}", "Temple calendar / मन्दिर पात्रो",
                              "Upcoming observances at the temple (dates are AD, Nepal time):\n" + "\n".join(part), "en+ne", "/calendar"))

    ev = []
    for r in sorted(tables.get("events", []), key=lambda r: r["event_date"]):
        if not r.get("is_active", True):
            continue
        d = date.fromisoformat(str(r["event_date"])[:10])
        if d < today or d > horizon:
            continue
        times = f" {str(r['start_time'])[:5]}–{str(r['end_time'])[:5]}" if r.get("start_time") and r.get("end_time") else ""
        ev.append(f"- {d.isoformat()}{times}: {_both(r.get('title_en'), r.get('title_ne'))}. {r.get('description_en') or ''}"
                  f"{' Location: ' + r['location_en'] if r.get('location_en') else ''}")
    if ev:
        out.append(Source("event", "events:upcoming", "Upcoming temple events / आगामी कार्यक्रम",
                          "Upcoming events and programmes at the temple:\n" + "\n".join(ev), "en+ne", "/events"))
    return out


def fetch_tables(cfg: RagConfig) -> dict[str, list[dict]]:
    """Read the content tables from Supabase (service key → bypasses RLS)."""
    from supabase import create_client
    if not (cfg.supabase_url and cfg.supabase_service_key):
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set to ingest from the database")
    sb = create_client(cfg.supabase_url, cfg.supabase_service_key)
    tables = {}
    for t in ("temple_info", "books", "poojas", "archanas", "calendar_events", "events"):
        tables[t] = sb.table(t).select("*").limit(5000).execute().data
    return tables


def attach_pdf_text(books: list[dict], max_pages: int = 400) -> None:
    """Download each book's PDF (if any) and extract its text into row['_pdf_text']."""
    import httpx
    from pypdf import PdfReader
    for b in books:
        url = b.get("pdf_url")
        if not url or not url.startswith("http"):
            continue
        try:
            resp = httpx.get(url, timeout=60, follow_redirects=True)
            resp.raise_for_status()
            reader = PdfReader(io.BytesIO(resp.content))
            b["_pdf_text"] = "\n\n".join((p.extract_text() or "") for p in reader.pages[:max_pages])
        except Exception as e:                      # one bad PDF shouldn't stop ingestion
            log.warning("Could not read PDF for %s: %s", b.get("title_en"), e)


# ---------------------------------------------------------------- files
def file_sources(knowledge_dir: Path) -> list[Source]:
    """Scriptures / notes dropped into ai-services/knowledge_base (.pdf, .md, .txt)."""
    out = []
    if not knowledge_dir.exists():
        return out
    for path in sorted(knowledge_dir.rglob("*")):
        if path.suffix.lower() not in {".pdf", ".md", ".txt"} or path.name.startswith("."):
            continue
        try:
            if path.suffix.lower() == ".pdf":
                from pypdf import PdfReader
                text = "\n\n".join((p.extract_text() or "") for p in PdfReader(str(path)).pages)
            else:
                text = path.read_text(encoding="utf-8", errors="replace")
        except Exception as e:
            log.warning("Skipping %s: %s", path, e)
            continue
        rel = path.relative_to(knowledge_dir).as_posix()
        out.append(Source("file", f"file:{rel}", path.stem.replace("_", " ").replace("-", " "), text, source_path=rel))
    return out
