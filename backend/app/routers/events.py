# backend/app/routers/events.py
# Full CRUD for temple events.
# Public:   GET /events, GET /events/{id}
# Admin:    POST, PATCH, DELETE (require_admin)

from uuid import UUID
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.auth import require_admin
from app.database import get_supabase, fetch_one
from app.schemas.events import EventCategory, EventCreate, EventUpdate, EventResponse

router = APIRouter(prefix="/events", tags=["Events"])


# ---------------------------------------------------------------------------
# GET  /events  — list all active events (optionally filtered)
# ---------------------------------------------------------------------------
@router.get("/", response_model=list[EventResponse])
def list_events(
    upcoming: bool = Query(False, description="Return only future events"),
    featured: bool = Query(False, description="Return only featured events"),
    category: Optional[EventCategory] = Query(None, description="Filter by category"),
    limit: int  = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client  = Depends(get_supabase),
):
    query = (
        db.table("events")
        .select("*")
        .eq("is_active", True)
        .order("event_date", desc=False)
        .range(offset, offset + limit - 1)
    )
    if upcoming:
        query = query.gte("event_date", str(date.today()))
    if featured:
        query = query.eq("is_featured", True)
    if category:
        query = query.eq("category", category)

    return query.execute().data


# ---------------------------------------------------------------------------
# GET  /events/{id}  — single event
# ---------------------------------------------------------------------------
@router.get("/{event_id}", response_model=EventResponse)
def get_event(event_id: UUID, db: Client = Depends(get_supabase)):
    row = fetch_one(db.table("events").select("*").eq("id", str(event_id)))
    if not row:
        raise HTTPException(status_code=404, detail="Event not found")
    return row


# ---------------------------------------------------------------------------
# POST /events  — create (admin only)
# ---------------------------------------------------------------------------
@router.post(
    "/", response_model=EventResponse, status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_event(payload: EventCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(mode="json", exclude_none=True)
    result = db.table("events").insert(data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create event")
    return result.data[0]


# ---------------------------------------------------------------------------
# PATCH /events/{id}  — partial update (admin only)
# ---------------------------------------------------------------------------
@router.patch("/{event_id}", response_model=EventResponse, dependencies=[Depends(require_admin)])
def update_event(
    event_id: UUID,
    payload: EventUpdate,
    db: Client = Depends(get_supabase),
):
    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    result = db.table("events").update(data).eq("id", str(event_id)).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
    return result.data[0]


# ---------------------------------------------------------------------------
# DELETE /events/{id}  — soft-delete (admin only)
# ---------------------------------------------------------------------------
@router.delete(
    "/{event_id}", status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_admin)],
)
def delete_event(event_id: UUID, db: Client = Depends(get_supabase)):
    # Soft-delete: set is_active = False
    result = (
        db.table("events")
        .update({"is_active": False})
        .eq("id", str(event_id))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Event not found")
