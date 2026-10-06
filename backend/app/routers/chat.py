"""
POST /api/v1/chat — "Ask the Pandit" (retrieval-augmented Claude assistant).

Request:  { "message": "...", "session_id": "<uuid from the browser>", "locale": "en"|"ne" }
Response: { "answer": "...", "language": "en"|"ne", "sources": [{n, title, type, url}] }

Security / cost controls
  • The Anthropic API key stays in backend/.env; the browser never calls Claude.
  • Conversation history is loaded from chat_history on the server (by
    session_id), never taken from the request, so a client can't forge
    earlier assistant turns.
  • Per-IP limits (CHAT_PER_MINUTE / CHAT_PER_DAY) + 1000-char messages.
  • Both messages are stored in chat_history with token counts, linked to
    the user when a valid Supabase token is sent.

The heavy RAG stack (torch, ChromaDB) is imported lazily: if it isn't
installed or no API key is set, this endpoint returns 503 and the rest of
the API keeps working.
"""
from __future__ import annotations

import logging
import threading
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict, deque
from typing import Any, Literal, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field, field_validator
from supabase import Client

from app.auth import get_optional_user
from app.config import settings
from app.database import get_supabase

log = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["AI assistant"])


# ---------------------------------------------------------------- schemas
class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    session_id: UUID
    locale: Literal["en", "ne"] = "en"

    @field_validator("message")
    @classmethod
    def not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message is empty")
        return v


class ChatSource(BaseModel):
    n: int
    title: str
    type: str
    url: str = ""


class ChatResponse(BaseModel):
    answer: str
    language: Literal["en", "ne"]
    sources: list[ChatSource] = []


# ---------------------------------------------------------------- rate limiting
class RateLimiter:
    """In-memory sliding windows per key. Fine for one backend process;
    use Redis (or the host's rate limiting) if you run several workers."""

    def __init__(self):
        self.hits: dict[str, deque] = defaultdict(deque)
        self.lock = threading.Lock()

    def allow(self, key: str, per_minute: int, per_day: int) -> bool:
        now = time.time()
        with self.lock:
            q = self.hits[key]
            while q and now - q[0] > 86400:
                q.popleft()
            if len(q) >= per_day or sum(1 for t in q if now - t < 60) >= per_minute:
                return False
            q.append(now)
            return True


limiter = RateLimiter()


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


# ---------------------------------------------------------------- assistant (lazy singleton)
_assistant = None
_assistant_lock = threading.Lock()


def get_assistant():
    """Build the RAG assistant once. Raises 503 if it can't be configured."""
    global _assistant
    if _assistant is not None:
        return _assistant
    with _assistant_lock:
        if _assistant is not None:
            return _assistant
        if not settings.ANTHROPIC_API_KEY:
            raise HTTPException(503, "The assistant is not configured (ANTHROPIC_API_KEY missing).")
        try:
            from dataclasses import replace
            from temple_rag.assistant import PanditAssistant
            from temple_rag.config import load_config
            from temple_rag.store import KnowledgeStore
        except ImportError as e:
            # Clearing this: `cd backend && pip install -r requirements.txt`,
            # which installs the sibling package via `-e ../ai-services`.
            log.error("temple_rag is not importable (%s). Run: cd backend && "
                      "pip install -r requirements.txt", e)
            raise HTTPException(503, "The assistant is not installed on this server.")
        cfg = replace(load_config(), anthropic_api_key=settings.ANTHROPIC_API_KEY, claude_model=settings.CLAUDE_MODEL,
                      supabase_url=settings.SUPABASE_URL, supabase_service_key=settings.SUPABASE_SERVICE_KEY)
        _assistant = PanditAssistant(cfg, KnowledgeStore(cfg))
        return _assistant


def load_history(db: Client, session_id: str, limit: int = 8) -> list[dict]:
    rows = (db.table("chat_history").select("role, content, created_at").eq("session_id", session_id)
            .order("created_at", desc=True).limit(limit).execute().data)
    return [{"role": r["role"], "content": r["content"]} for r in reversed(rows)]


# ---------------------------------------------------------------- endpoint
@router.post("/", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    request: Request,
    db: Client = Depends(get_supabase),
    user: Optional[Any] = Depends(get_optional_user),
):
    if not limiter.allow(f"ip:{client_ip(request)}", settings.CHAT_PER_MINUTE, settings.CHAT_PER_DAY):
        raise HTTPException(429, "Too many questions — please wait a minute and try again.")

    assistant = get_assistant()
    session_id = str(body.session_id)
    asked_at = datetime.now(timezone.utc)
    try:
        history = load_history(db, session_id)
    except Exception:
        history = []                                  # history is a nicety, not a requirement

    import anthropic
    try:
        ans = assistant.answer(body.message, history=history, locale_hint=body.locale)
    except anthropic.RateLimitError:
        raise HTTPException(503, "The assistant is busy right now. Please try again shortly.")
    except (anthropic.APIConnectionError, anthropic.APITimeoutError):
        raise HTTPException(503, "Couldn't reach the AI service. Please try again shortly.")
    except anthropic.AuthenticationError:
        log.error("Anthropic rejected the API key")
        raise HTTPException(503, "The assistant is not configured correctly.")
    except anthropic.APIStatusError as e:
        log.error("Claude API error %s: %s", e.status_code, getattr(e, "message", e))
        raise HTTPException(503, "The assistant had a problem answering. Please try again.")

    user_id = str(user.id) if user is not None else None
    # Explicit timestamps: both rows go in one statement, where Postgres now()
    # would give them the SAME created_at and make history order ambiguous.
    answered_at = max(datetime.now(timezone.utc), asked_at + timedelta(microseconds=1))
    try:
        db.table("chat_history").insert([
            {"session_id": session_id, "user_id": user_id, "role": "user", "content": body.message,
             "locale": body.locale, "created_at": asked_at.isoformat()},
            {"session_id": session_id, "user_id": user_id, "role": "assistant", "content": ans.text,
             "created_at": answered_at.isoformat(),
             "locale": ans.language, "sources": ans.sources, "model": ans.model,
             "input_tokens": ans.input_tokens, "output_tokens": ans.output_tokens},
        ]).execute()
    except Exception as e:                             # never lose the answer because logging failed
        log.warning("Could not store chat history: %s", e)

    return ChatResponse(answer=ans.text, language=ans.language, sources=ans.sources)
