"""
Text → vector embeddings.

Why a local multilingual model instead of ChromaDB's default?
  ChromaDB's built-in embedder (all-MiniLM-L6-v2) is English-only, so a
  question typed in Nepali (Devanagari) would not match the temple's Nepali
  or English passages. Anthropic doesn't offer a first-party embeddings
  endpoint, so we use `intfloat/multilingual-e5-small` via
  sentence-transformers: free, runs on the server's CPU (~470 MB RAM), no
  second API key, and handles Nepali ⇄ English cross-lingual retrieval.
  (A hosted alternative such as Voyage AI's multilingual model would avoid
  the torch dependency — swap it in by adding a class with the same API.)

e5 models expect "query: " / "passage: " prefixes — handled here.
"""
from __future__ import annotations

import hashlib
import math
import re
from functools import lru_cache
from typing import Protocol


class Embedder(Protocol):
    dim: int
    def embed_passages(self, texts: list[str]) -> list[list[float]]: ...
    def embed_query(self, text: str) -> list[float]: ...


class E5Embedder:
    """sentence-transformers wrapper for the multilingual E5 family."""

    def __init__(self, model_name: str):
        from sentence_transformers import SentenceTransformer   # heavy import, done lazily
        self.model = SentenceTransformer(model_name, device="cpu")
        self.dim = self.model.get_sentence_embedding_dimension()

    def embed_passages(self, texts: list[str]) -> list[list[float]]:
        vecs = self.model.encode([f"passage: {t}" for t in texts], batch_size=16,
                                 normalize_embeddings=True, show_progress_bar=False)
        return vecs.tolist()

    def embed_query(self, text: str) -> list[float]:
        return self.model.encode(f"query: {text}", normalize_embeddings=True).tolist()


class HashEmbedder:
    """
    Deterministic bag-of-words hashing embedder — NO downloads, NOT semantic.
    Only for tests / offline development (EMBEDDING_MODEL=hash).
    """
    dim = 256

    def _vec(self, text: str) -> list[float]:
        v = [0.0] * self.dim
        for tok in re.findall(r"\w+", text.lower()):
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            v[h % self.dim] += 1.0
        n = math.sqrt(sum(x * x for x in v)) or 1.0
        return [x / n for x in v]

    def embed_passages(self, texts: list[str]) -> list[list[float]]:
        return [self._vec(t) for t in texts]

    def embed_query(self, text: str) -> list[float]:
        return self._vec(text)


@lru_cache(maxsize=2)
def get_embedder(model_name: str) -> Embedder:
    """One embedder per process (loading the model takes a few seconds)."""
    if model_name == "hash":
        return HashEmbedder()
    return E5Embedder(model_name)
