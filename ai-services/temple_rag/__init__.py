"""
temple_rag — retrieval-augmented "Ask the Pandit" assistant for
Shree Laxminarayan Mandir.

  config.py      settings + the Gemini model choice (and why)
  embeddings.py  multilingual e5 embeddings (EN + Nepali)
  chunking.py    sentence-aware chunking (handles the Devanagari danda)
  sources.py     temple content → knowledge-base sources
  store.py       ChromaDB persistence and search
  ingest.py      incremental ingestion (kb_documents hash ledger)
  tools.py       the agent's read-only tools (one per data source)
  assistant.py   the LangGraph agent: guard -> agent <-> tools ->
                 ground_check -> finalize (see docs/AGENT.md)
  fake_model.py  scripted model for offline tests / evals

Used by the FastAPI backend (POST /api/v1/chat) and by scripts/ingest.py.
"""
from .config import RagConfig, load_config

__all__ = ["RagConfig", "load_config"]
