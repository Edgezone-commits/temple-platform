# backend/app/database.py
# Supabase client initialisation for FastAPI
# Uses the service-role key so it can bypass RLS for server-side operations.

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