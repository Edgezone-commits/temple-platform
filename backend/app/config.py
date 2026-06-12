# backend/app/config.py
# Pydantic Settings — reads from .env automatically.

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # --- App ---------------------------------------------------------------
    APP_NAME: str = "Shree Laxminarayan Mandir API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # --- Supabase ----------------------------------------------------------
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_KEY: str  # Only used server-side (never expose to client)

    # --- Gemini AI ---------------------------------------------------------
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings: Settings = get_settings()