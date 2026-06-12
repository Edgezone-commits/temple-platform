"""
Shree Laxminarayan Mandir - Backend Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Supabase
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    database_url: str = ""

    # AI
    gemini_api_key: str = ""

    # CORS
    cors_origins: str = "http://localhost:3000"

    # App
    app_name: str = "Shree Laxminarayan Mandir API"
    debug: bool = True

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
