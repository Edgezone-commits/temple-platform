# backend/app/routers/poojas.py
# CRUD for pooja services + public booking submission.
# Public:  GET /poojas, GET /poojas/{id}, POST /bookings
# Admin:   pooja writes, all booking reads/updates (they contain devotee PII)

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from supabase import Client

from app.auth import require_admin
from app.database import get_supabase, fetch_one
from app.schemas.poojas import (
    PoojaCreate, PoojaUpdate, PoojaResponse,
    BookingCreate, BookingUpdate, BookingResponse, BookingStatus,
)

router = APIRouter(tags=["Poojas & Bookings"])


# ===========================================================================
# POOJA SERVICES  — /poojas
# ===========================================================================
pooja_router = APIRouter(prefix="/poojas")


@pooja_router.get("/", response_model=list[PoojaResponse])
def list_poojas(
    available_only: bool = Query(True),
    db: Client = Depends(get_supabase),
):
    query = db.table("poojas").select("*").order("sort_order")
    if available_only:
        query = query.eq("is_available", True)
    return query.execute().data


@pooja_router.get("/{pooja_id}", response_model=PoojaResponse)
def get_pooja(pooja_id: UUID, db: Client = Depends(get_supabase)):
    row = fetch_one(db.table("poojas").select("*").eq("id", str(pooja_id)))
    if not row:
        raise HTTPException(404, "Pooja not found")
    return row


@pooja_router.post("/", response_model=PoojaResponse, status_code=201, dependencies=[Depends(require_admin)])
def create_pooja(payload: PoojaCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(mode="json", exclude_none=True)
    result = db.table("poojas").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create pooja")
    return result.data[0]


@pooja_router.patch("/{pooja_id}", response_model=PoojaResponse, dependencies=[Depends(require_admin)])
def update_pooja(
    pooja_id: UUID, payload: PoojaUpdate, db: Client = Depends(get_supabase)
):
    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    result = db.table("poojas").update(data).eq("id", str(pooja_id)).execute()
    if not result.data:
        raise HTTPException(404, "Pooja not found")
    return result.data[0]


@pooja_router.delete("/{pooja_id}", status_code=204, dependencies=[Depends(require_admin)])
def delete_pooja(pooja_id: UUID, db: Client = Depends(get_supabase)):
    # Soft-delete: hide from the public list
    result = db.table("poojas").update({"is_available": False}).eq("id", str(pooja_id)).execute()
    if not result.data:
        raise HTTPException(404, "Pooja not found")


# ===========================================================================
# POOJA BOOKINGS  — /bookings
# ===========================================================================
booking_router = APIRouter(prefix="/bookings")

BOOKING_SELECT = "*, pooja:poojas(name_en, name_ne)"  # alias the join to match BookingResponse.pooja


@booking_router.post("/", response_model=BookingResponse, status_code=201)
def create_booking(payload: BookingCreate, db: Client = Depends(get_supabase)):
    """Public endpoint — devotees submit pooja bookings."""
    data = payload.model_dump(mode="json", exclude_none=True)

    if "pooja_id" in data:
        pooja = fetch_one(db.table("poojas").select("id, is_available").eq("id", data["pooja_id"]))
        if not pooja or not pooja["is_available"]:
            raise HTTPException(422, "Selected pooja is not available")

    result = db.table("pooja_bookings").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to submit booking")
    return result.data[0]


@booking_router.get("/", response_model=list[BookingResponse], dependencies=[Depends(require_admin)])
def list_bookings(
    status_filter: Optional[BookingStatus] = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_supabase),
):
    """Admin endpoint — list all bookings."""
    query = (
        db.table("pooja_bookings")
        .select(BOOKING_SELECT)
        .order("booking_date", desc=True)
        .range(offset, offset + limit - 1)
    )
    if status_filter:
        query = query.eq("status", status_filter)
    return query.execute().data


@booking_router.get("/{booking_id}", response_model=BookingResponse, dependencies=[Depends(require_admin)])
def get_booking(booking_id: UUID, db: Client = Depends(get_supabase)):
    row = fetch_one(db.table("pooja_bookings").select(BOOKING_SELECT).eq("id", str(booking_id)))
    if not row:
        raise HTTPException(404, "Booking not found")
    return row


@booking_router.patch("/{booking_id}", response_model=BookingResponse, dependencies=[Depends(require_admin)])
def update_booking(
    booking_id: UUID, payload: BookingUpdate, db: Client = Depends(get_supabase)
):
    """Admin endpoint — confirm/cancel bookings."""
    data = payload.model_dump(mode="json", exclude_unset=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    result = db.table("pooja_bookings").update(data).eq("id", str(booking_id)).execute()
    if not result.data:
        raise HTTPException(404, "Booking not found")
    return result.data[0]


# Combine both sub-routers into one exported router
router.include_router(pooja_router)
router.include_router(booking_router)
