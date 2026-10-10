"""
temple_rag configuration — everything comes from environment variables
(backend/.env when imported by the FastAPI app, ai-services/.env when the
ingest script runs on its own).

Model choice (GEMINI_MODEL, default "gemini-3.8-flash")
-------------------------------------------------------
"Ask the Pandit" is a retrieval-grounded Q&A chat with tool calling: the facts
come from the temple's own database and knowledge base, the model's job is to
pick the right tool, read a few short passages, answer briefly and accurately
in English or Nepali, and say "I don't know" when the tools return nothing.

  • gemini-3.8-flash  ← DEFAULT
      Fast, cheap, and has a generous free tier (see the pricing page below),
      which matters for a temple running on donations. Strong multilingual
      reading and writing, Nepali/Devanagari included, and reliable function
      calling — which is what this agent depends on.
  • gemini-3.5-flash
      The previous stable flash. Keep this name in mind only as a fallback if
      a 3.8 release ever misbehaves; there is no quality reason to prefer it.

NOT gemini-2.5-flash / gemini-2.5-pro any more. The 2.5 family is still listed
by models.list() but Google now refuses it for keys created after the cutover:

    404  This model models/gemini-2.5-flash is no longer available to new
         users. Please update your code to use models/gemini-3.8-flash

So a 2.5 name does not fail at startup — it fails on the first real question,
which is the worst time to find out. Verified against a fresh AI Studio key on
2026-10-10: 3.8-flash and 3.5-flash answer; every 2.5 name 404s; the pro tier
(gemini-3.1-pro-preview, gemini-pro-latest) returns 429 RESOURCE_EXHAUSTED
because the free tier carries no pro quota. That is why no pro model is
recommended here: on a donation-funded key it would simply not answer.

Switching is one env var (GEMINI_MODEL); the code is not tied to any of them.

  Get a key:  https://aistudio.google.com/apikey
  Pricing:    https://ai.google.dev/pricing
"""
import os
from dataclasses import dataclass, field
from pathlib import Path

AI_DIR = Path(__file__).resolve().parents[1]


def _env(name: str, default: str = "") -> str:
    return os.environ.get(name, default).strip()


@dataclass(frozen=True)
class RagConfig:
    # --- Gemini (server-side only; never sent to the browser) ------------------
    google_api_key: str = field(default_factory=lambda: _env("GOOGLE_API_KEY"))
    gemini_model: str = field(default_factory=lambda: _env("GEMINI_MODEL", "gemini-3.8-flash"))
    max_answer_tokens: int = field(default_factory=lambda: int(_env("GEMINI_MAX_TOKENS", "2000")))
    # Low temperature: this is grounded Q&A, not creative writing. The answer
    # should be the same every time the same passages come back.
    temperature: float = field(default_factory=lambda: float(_env("GEMINI_TEMPERATURE", "0.2")))
    # Hard cap on agent <-> tools loops for one question. See docs/AGENT.md.
    max_tool_rounds: int = field(default_factory=lambda: int(_env("AGENT_MAX_TOOL_ROUNDS", "4")))

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

    # --- Supabase (for ingestion, the agent's tools, and chat history) --------
    # Service key, server-side only. The tools read with it but never write.
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
