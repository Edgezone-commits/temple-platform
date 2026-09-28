# backend/app/auth.py
# Authentication / authorisation dependencies.
#
# The frontend sends the logged-in user's Supabase access token as
#   Authorization: Bearer <jwt>
# We validate it with Supabase Auth (so revoked/expired tokens are rejected)
# and then look up the user's role in public.profiles.
#
# The backend talks to Postgres with the service-role key, which BYPASSES RLS,
# so these checks are the only thing protecting write endpoints.

from typing import Any, Optional

from fastapi import Depends, Header, HTTPException, status
from supabase import Client

from app.database import get_supabase, fetch_one


def _bearer_token(authorization: Optional[str]) -> Optional[str]:
    if not authorization:
        return None
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        return None
    return token.strip()


def get_optional_user(
    authorization: Optional[str] = Header(None),
    db: Client = Depends(get_supabase),
) -> Optional[Any]:
    """Return the Supabase user for a valid bearer token, or None if absent/invalid."""
    token = _bearer_token(authorization)
    if not token:
        return None
    try:
        res = db.auth.get_user(token)
    except Exception:
        return None
    return res.user if res else None


def get_current_user(user: Optional[Any] = Depends(get_optional_user)) -> Any:
    """Require a logged-in user."""
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_admin(
    user: Any = Depends(get_current_user),
    db: Client = Depends(get_supabase),
) -> Any:
    """Require a logged-in user whose profiles.role is 'admin'. Fails closed."""
    try:
        profile = fetch_one(db.table("profiles").select("role").eq("id", str(user.id)))
    except Exception:
        # e.g. profiles table not created yet — deny rather than allow.
        profile = None
    if not profile or profile.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
