"""
Ingestion: temple content (Supabase tables + knowledge_base/ files) → ChromaDB.

Incremental: each source's content hash is recorded in public.kb_documents;
unchanged sources are skipped, changed ones re-embedded, and sources that
disappeared upstream (e.g. an unpublished book) are removed from the index.

Run:  python ai-services/scripts/ingest.py            (see that script)
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import datetime, timezone

from .config import RagConfig
from .sources import Source, attach_pdf_text, fetch_tables, file_sources, rows_to_sources
from .store import KnowledgeStore

log = logging.getLogger(__name__)


@dataclass
class IngestReport:
    sources: int = 0
    embedded: int = 0
    skipped: int = 0
    chunks: int = 0
    removed: int = 0


class HashLedger:
    """Where content hashes are remembered. Default: public.kb_documents via Supabase."""

    def __init__(self, cfg: RagConfig | None = None, memory: dict | None = None):
        self.memory = memory
        self.sb = None
        if memory is None and cfg and cfg.supabase_url and cfg.supabase_service_key:
            from supabase import create_client
            self.sb = create_client(cfg.supabase_url, cfg.supabase_service_key)

    def get(self, src: Source) -> str | None:
        if self.memory is not None:
            return self.memory.get(src.source_key)
        if not self.sb:
            return None
        q = self.sb.table("kb_documents").select("content_hash").eq("source_type", src.source_type)
        q = q.eq("source_id", src.source_id) if src.source_id else q.eq("source_path", src.source_path or src.source_key)
        rows = q.limit(1).execute().data
        return rows[0]["content_hash"] if rows else None

    def put(self, src: Source, chunk_count: int) -> None:
        if self.memory is not None:
            self.memory[src.source_key] = src.content_hash
            return
        if not self.sb:
            return
        row = {"source_type": src.source_type, "title": src.title[:300], "language": src.lang or None,
               "content_hash": src.content_hash, "chunk_count": chunk_count,
               "ingested_at": datetime.now(timezone.utc).isoformat()}
        match = {"source_id": src.source_id} if src.source_id else {"source_path": src.source_path or src.source_key}
        existing = self.sb.table("kb_documents").select("id").eq("source_type", src.source_type).match(match).limit(1).execute().data
        if existing:
            self.sb.table("kb_documents").update(row).eq("id", existing[0]["id"]).execute()
        else:
            self.sb.table("kb_documents").insert({**row, **match}).execute()


def ingest_sources(sources: list[Source], store: KnowledgeStore, ledger: HashLedger, force: bool = False) -> IngestReport:
    rep = IngestReport(sources=len(sources))
    for src in sources:
        if not force and ledger.get(src) == src.content_hash and store.col.get(where={"source_key": src.source_key}, limit=1)["ids"]:
            rep.skipped += 1
            continue
        n = store.replace_source(src.source_key, src.to_chunks(store.cfg))
        ledger.put(src, n)
        rep.embedded += 1
        rep.chunks += n
    # remove sources that no longer exist upstream
    by_type: dict[str, set[str]] = {}
    for s in sources:
        by_type.setdefault(s.source_type, set()).add(s.source_key)
    for t in ("temple_info", "book", "pooja", "calendar", "event", "file"):
        rep.removed += store.remove_sources_except(t, by_type.get(t, set()))
    return rep


def run_ingest(cfg: RagConfig, force: bool = False, include_db: bool = True) -> IngestReport:
    sources: list[Source] = []
    if include_db:
        tables = fetch_tables(cfg)
        attach_pdf_text(tables.get("books", []))
        sources += rows_to_sources(tables)
    sources += file_sources(cfg.knowledge_dir)
    store = KnowledgeStore(cfg)
    rep = ingest_sources(sources, store, HashLedger(cfg), force=force)
    log.info("Ingest: %s sources, %s embedded (%s chunks), %s unchanged, %s removed; index now %s chunks",
             rep.sources, rep.embedded, rep.chunks, rep.skipped, rep.removed, store.count())
    return rep
