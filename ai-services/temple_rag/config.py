"""
temple_rag configuration — everything comes from environment variables
(backend/.env when imported by the FastAPI app, ai-services/.env when the
ingest script runs on its own).

Model choice (CLAUDE_MODEL, default "claude-sonnet-5-5")
---------------------------------------------------------
"Ask the Pandit" is a retrieval-grounded Q&A chat: the facts come from the
retrieved temple context, the model's job is to read a few short passages,
answer briefly and accurately in English or Nepali, and say "I don't know"
when the context doesn't cover the question.

  • claude-sonnet-5-5  $2 / $10 per 1M input/output tokens  ← DEFAULT
      The current Sonnet. Best quality-per-cost for a production chat with
      moderate traffic; strong multilingual (incl. Nepali/Devanagari)
      reading and writing. A typical turn here is ~2–3k input tokens +
      ~300 output tokens, i.e. roughly $0.007 per answer (≈ NPR 1).
  • claude-opus-5-5    $4 / $20 — about 2× the price; worth it only if you
      see answers missing nuance in long scripture passages.
  • claude-haiku-4-5   $1 / $5  — cheapest/fastest, but weaker at careful
      "only answer from the context" behaviour and at Nepali prose.
  (claude-sonnet-5, the previous Sonnet, also works at the same price.)

Switching is one env var (CLAUDE_MODEL); the code works with all three.
"""
import os
from dataclasses import dataclass, field
from pathlib import Path

AI_DIR = Path(__file__).resolve().parents[1]


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


@dataclass(frozen=True)
class RagConfig:
    # --- Claude (server-side only; never sent to the browser) ------------------
    anthropic_api_key: str = field(default_factory=lambda: _env("ANTHROPIC_API_KEY"))
    claude_model: str = field(default_factory=lambda: _env("CLAUDE_MODEL", "claude-sonnet-5-5"))
    # Short grounded answers don't benefit from deep deliberation; "low" keeps
    # latency and cost down. Raise to "medium" if answers feel thin.
    claude_effort: str = field(default_factory=lambda: _env("CLAUDE_EFFORT", "low"))
    max_answer_tokens: int = field(default_factory=lambda: int(_env("CLAUDE_MAX_TOKENS", "2000")))

    # --- Embeddings / vector store -------------------------------------------
    # multilingual-e5-small: 118M params, 384-dim, ~100 languages incl. Nepali,
    # runs on CPU. Set EMBEDDING_MODEL=hash only for offline tests.
    embedding_model: str = field(default_factory=lambda: _env("EMBEDDING_MODEL", "intfloat/multilingual-e5-small"))
    chroma_dir: Path = field(default_factory=lambda: Path(_env("CHROMA_PERSIST_DIR", str(AI_DIR / "chroma_db"))))
    collection: str = field(default_factory=lambda: _env("CHROMA_COLLECTION", "temple_kb"))
    knowledge_dir: Path = field(default_factory=lambda: Path(_env("KNOWLEDGE_BASE_DIR", str(AI_DIR / "knowledge_base"))))

    # --- Retrieval ------------------------------------------------------------
    top_k: int = field(default_factory=lambda: int(_env("RAG_TOP_K", "6")))
    # Cosine similarity below this is treated as "not relevant" (e5 scores
    # cluster high, so this is deliberately not tiny).
    # (measured on the temple data with multilingual-e5-small: relevant
    # passages scored ≥ 0.815, off-topic questions 0.74–0.79, EN and NE alike)
    min_similarity: float = field(default_factory=lambda: float(_env("RAG_MIN_SIMILARITY", "0.80")))
    chunk_chars: int = 900
    chunk_overlap: int = 150

    # --- Supabase (for ingestion + chat history; service key, server-side) ----
    supabase_url: str = field(default_factory=lambda: _env("SUPABASE_URL"))
    supabase_service_key: str = field(default_factory=lambda: _env("SUPABASE_SERVICE_KEY"))


def load_config() -> RagConfig:
    """Read ai-services/.env (if present) without overriding real env vars."""
    env_file = AI_DIR / ".env"
    if env_file.exists():
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file, override=False)
        except ImportError:
            pass
    return RagConfig()
