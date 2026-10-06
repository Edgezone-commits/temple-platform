# backend/app/config.py
# Pydantic Settings — reads from .env automatically.

from functools import lru_cache

from pydantic import ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---------------------------------------------------------------
    APP_NAME: str = "Shree Laxminarayan Mandir API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    # Browsers treat localhost and 127.0.0.1 as different origins, and Next.js
    # dev prints whichever one you opened — so both are allowed by default.
    # In production, set ALLOWED_ORIGINS to the real domain only.
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # --- Supabase ----------------------------------------------------------
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str  # Only used server-side (never expose to client)

    # --- "Ask the Pandit" AI assistant (server-side only) -------------------
    # Get a key at https://console.anthropic.com → API Keys. Never put it in
    # the frontend; the browser only ever talks to /api/v1/chat.
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-5-5"      # why: see ai-services/temple_rag/config.py
    # Chat abuse limits (per client IP)
    CHAT_PER_MINUTE: int = 8
    CHAT_PER_DAY: int = 150


# The three Supabase settings have no default on purpose: starting the API
# against no database would fail later in a far more confusing way. Pydantic's
# own ValidationError doesn't say where the values belong, so translate it.
REQUIRED_HINT = r"""
Missing required settings: {missing}

Create backend/.env (copy backend/.env.example) and fill in the values from
your Supabase project: Project Settings -> API.
  bash:        cp backend/.env.example backend/.env
  PowerShell:  Copy-Item backend\.env.example backend\.env
"""


@lru_cache()
def get_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as e:
        missing = [str(err["loc"][0]) for err in e.errors() if err["type"] == "missing"]
        if not missing:
            raise
        raise RuntimeError(REQUIRED_HINT.format(missing=", ".join(missing))) from e


settings: Settings = get_settings()
