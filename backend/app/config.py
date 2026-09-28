# backend/app/config.py
# Pydantic Settings — reads from .env automatically.

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # --- App ---------------------------------------------------------------
    APP_NAME: str = "Shree Laxminarayan Mandir API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # --- Supabase ----------------------------------------------------------
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str  # Only used server-side (never expose to client)

    # --- Gemini AI (replaced by Anthropic in Phase 7) ----------------------
    GEMINI_API_KEY: str = ""


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()
