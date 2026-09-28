# backend/app/database.py
# Supabase client initialisation for FastAPI
# Uses the service-role key so it can bypass RLS for server-side operations.
# Because RLS is bypassed, every write route MUST be guarded by app.auth.require_admin.

from typing import Any, Optional

from supabase import create_client, Client
from app.config import settings

# ---------------------------------------------------------------------------
# Synchronous Supabase client (supabase-py v2)
# Uses SERVICE ROLE key — never expose this on the frontend.
# ---------------------------------------------------------------------------
supabase: Client = create_client(
    supabase_url=settings.SUPABASE_URL,
    supabase_key=settings.SUPABASE_SERVICE_KEY,
)


def get_supabase() -> Client:
    """
    FastAPI dependency that returns the Supabase client.

    Usage in a router:
        @router.get("/")
        def list_items(db: Client = Depends(get_supabase)):
            ...
    """
    return supabase


def fetch_one(query) -> Optional[dict[str, Any]]:
    """
    Execute a select query and return the first row, or None.

    Use this instead of `.single()`: supabase-py's `.single()` raises an
    APIError when zero rows match, which surfaced as a 500 instead of a 404.
    """
    rows = query.limit(1).execute().data
    return rows[0] if rows else None
