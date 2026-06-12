# backend/app/routers/poojas.py
# CRUD for pooja services + public booking submission.

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.database import get_supabase
from app.schemas.poojas import (
    PoojaCreate, PoojaUpdate, PoojaResponse,
    BookingCreate, BookingUpdate, BookingResponse,
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
    result = db.table("poojas").select("*").eq("id", str(pooja_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Pooja not found")
    return result.data


@pooja_router.post("/", response_model=PoojaResponse, status_code=201)
def create_pooja(payload: PoojaCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(exclude_none=True)
    result = db.table("poojas").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create pooja")
    return result.data[0]


@pooja_router.patch("/{pooja_id}", response_model=PoojaResponse)
def update_pooja(
    pooja_id: UUID, payload: PoojaUpdate, db: Client = Depends(get_supabase)
):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    result = db.table("poojas").update(data).eq("id", str(pooja_id)).execute()
    if not result.data:
        raise HTTPException(404, "Pooja not found")
    return result.data[0]


@pooja_router.delete("/{pooja_id}", status_code=204)
def delete_pooja(pooja_id: UUID, db: Client = Depends(get_supabase)):
    db.table("poojas").update({"is_available": False}).eq("id", str(pooja_id)).execute()


# ===========================================================================
# POOJA BOOKINGS  — /bookings
# ===========================================================================
booking_router = APIRouter(prefix="/bookings")


@booking_router.post("/", response_model=BookingResponse, status_code=201)
def create_booking(payload: BookingCreate, db: Client = Depends(get_supabase)):
    """Public endpoint — devotees submit pooja bookings."""
    data = payload.model_dump(exclude_none=True)
    # Serialize date/time
    for field in ("booking_date", "booking_time"):
        if field in data and data[field] is not None:
            data[field] = str(data[field])
    if "pooja_id" in data:
        data["pooja_id"] = str(data["pooja_id"])

    result = db.table("pooja_bookings").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to submit booking")
    return result.data[0]


@booking_router.get("/", response_model=list[BookingResponse])
def list_bookings(
    status_filter: str = Query(None, alias="status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_supabase),
):
    """Admin endpoint — list all bookings."""
    query = (
        db.table("pooja_bookings")
        .select("*, poojas(name_en, name_ne)")
        .order("booking_date", desc=True)
        .range(offset, offset + limit - 1)
    )
    if status_filter:
        query = query.eq("status", status_filter)
    return query.execute().data


@booking_router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: UUID, db: Client = Depends(get_supabase)):
    result = (
        db.table("pooja_bookings")
        .select("*, poojas(name_en, name_ne)")
        .eq("id", str(booking_id))
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Booking not found")
    return result.data


@booking_router.patch("/{booking_id}", response_model=BookingResponse)
def update_booking(
    booking_id: UUID, payload: BookingUpdate, db: Client = Depends(get_supabase)
):
    """Admin endpoint — confirm/cancel bookings."""
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    for field in ("booking_date", "booking_time"):
        if field in data and data[field] is not None:
            data[field] = str(data[field])
    result = db.table("pooja_bookings").update(data).eq("id", str(booking_id)).execute()
    if not result.data:
        raise HTTPException(404, "Booking not found")
    return result.data[0]


# Combine both sub-routers into one exported router
router.include_router(pooja_router)
router.include_router(booking_router)