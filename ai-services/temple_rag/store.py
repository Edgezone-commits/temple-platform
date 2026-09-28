"""
ChromaDB vector store for the temple knowledge base.

Every chunk carries metadata {source_type, source_key, title, lang, url} so
answers can cite where they came from, and so re-ingesting one source can
replace just that source's chunks.
"""
from __future__ import annotations

from dataclasses import dataclass

from .config import RagConfig
from .embeddings import get_embedder


@dataclass
class Chunk:
    id: str
    text: str
    source_type: str       # 'temple_info' | 'book' | 'pooja' | 'calendar' | 'event' | 'file'
    source_key: str        # stable id of the source (row id / file path)
    title: str
    lang: str = ""
    url: str = ""


@dataclass
class Hit:
    text: str
    title: str
    source_type: str
    url: str
    similarity: float


class KnowledgeStore:
    def __init__(self, cfg: RagConfig, client=None):
        import chromadb
        self.cfg = cfg
        self.embedder = get_embedder(cfg.embedding_model)
        self.client = client or chromadb.PersistentClient(path=str(cfg.chroma_dir))
        # We supply embeddings ourselves (multilingual e5), so no embedding_function.
        self.col = self.client.get_or_create_collection(
            name=f"{cfg.collection}_{cfg.embedding_model.split('/')[-1]}",   # one collection per model
            metadata={"hnsw:space": "cosine"},
            embedding_function=None,
        )

    # ---------------------------------------------------------------- writes
    def replace_source(self, source_key: str, chunks: list[Chunk]) -> int:
        """Delete a source's old chunks and add the new ones."""
        self.col.delete(where={"source_key": source_key})
        if not chunks:
            return 0
        self.col.add(
            ids=[c.id for c in chunks],
            documents=[c.text for c in chunks],
            embeddings=self.embedder.embed_passages([c.text for c in chunks]),
            metadatas=[{"source_type": c.source_type, "source_key": c.source_key, "title": c.title,
                        "lang": c.lang, "url": c.url} for c in chunks],
        )
        return len(chunks)

    def remove_sources_except(self, source_type: str, keep_keys: set[str]) -> int:
        """Drop chunks of sources (of one type) that no longer exist upstream."""
        got = self.col.get(where={"source_type": source_type}, include=["metadatas"])
        stale = {m["source_key"] for m in got["metadatas"] if m["source_key"] not in keep_keys}
        for key in stale:
            self.col.delete(where={"source_key": key})
        return len(stale)

    def count(self) -> int:
        return self.col.count()

    # ---------------------------------------------------------------- reads
    def search(self, query: str, k: int | None = None) -> list[Hit]:
        if self.col.count() == 0:
            return []
        res = self.col.query(
            query_embeddings=[self.embedder.embed_query(query)],
            n_results=min(k or self.cfg.top_k, self.col.count()),
            include=["documents", "metadatas", "distances"],
        )
        hits = []
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            sim = 1.0 - float(dist)                     # cosine distance → similarity
            if sim >= self.cfg.min_similarity:
                hits.append(Hit(text=doc, title=meta.get("title", ""), source_type=meta.get("source_type", ""),
                                url=meta.get("url", ""), similarity=round(sim, 4)))
        return hits
