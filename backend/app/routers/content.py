# backend/app/routers/content.py
# Archanas, calendar events and temple info — built with the CRUD factory.
#
#   /archanas      public list of available archanas (sorted by sort_order)
#   /calendar      public list of published calendar entries, filterable by
#                  date range and category (used by /events strip + /calendar)
#   /temple-info   public bilingual key/value facts (timings, contact, history)
#   /gallery       public photos (Supabase Storage URLs), filterable by category,
#                  each with the linked event's title when event_id is set

from datetime import date
from typing import Any, Optional

from fastapi import Depends, Query
from supabase import Client

from app.auth import get_optional_user
from app.database import get_supabase
from app.routers._crud import crud_router
from app.schemas.content import (
    ArchanaCreate, ArchanaUpdate, ArchanaResponse,
    CalendarCategory, CalendarEventCreate, CalendarEventUpdate, CalendarEventResponse,
    TempleInfoCreate, TempleInfoUpdate, TempleInfoResponse,
    GalleryCategory, GalleryCreate, GalleryUpdate, GalleryResponse,
)

archanas_router = crud_router(
    table="archanas", prefix="/archanas", tag="Archanas", label="Archana",
    create_model=ArchanaCreate, update_model=ArchanaUpdate, response_model=ArchanaResponse,
    visible_field="is_available", soft_delete_field="is_available",
    order_by=[("sort_order", False), ("name_en", False)],
)

temple_info_router = crud_router(
    table="temple_info", prefix="/temple-info", tag="Temple info", label="Temple info entry",
    create_model=TempleInfoCreate, update_model=TempleInfoUpdate, response_model=TempleInfoResponse,
    visible_field=None,
    order_by=[("category", False), ("sort_order", False), ("key", False)],
)

calendar_router = crud_router(
    table="calendar_events", prefix="/calendar", tag="Calendar", label="Calendar event",
    create_model=CalendarEventCreate, update_model=CalendarEventUpdate, response_model=CalendarEventResponse,
    visible_field="is_published", order_by=[("event_date", False)],
    include_list=False,
)


@calendar_router.get("/", response_model=list[CalendarEventResponse])
def list_calendar(
    start: Optional[date] = Query(None, description="First date (inclusive)"),
    end: Optional[date] = Query(None, description="Last date (inclusive)"),
    category: Optional[CalendarCategory] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    all: bool = Query(False, description="Admins: include unpublished rows"),
    db: Client = Depends(get_supabase),
    user: Optional[Any] = Depends(get_optional_user),
):
    query = db.table("calendar_events").select("*")
    if not calendar_router.show_hidden(all, user, db):  # type: ignore[attr-defined]
        query = query.eq("is_published", True)
    if start:
        # Multi-day entries that started earlier but are still running count too.
        query = query.or_(f"event_date.gte.{start},end_date.gte.{start}")
    if end:
        query = query.lte("event_date", str(end))
    if category:
        query = query.eq("category", category)
    return query.order("event_date").limit(limit).execute().data


gallery_router = crud_router(
    table="gallery", prefix="/gallery", tag="Gallery", label="Photo",
    create_model=GalleryCreate, update_model=GalleryUpdate, response_model=GalleryResponse,
    visible_field="is_published", order_by=[("sort_order", False), ("created_at", True)],
    include_list=False,
)


@gallery_router.get("/", response_model=list[GalleryResponse])
def list_gallery(
    category: Optional[GalleryCategory] = Query(None),
    limit: int = Query(200, ge=1, le=500),
    offset: int = Query(0, ge=0),
    all: bool = Query(False, description="Admins: include unpublished photos"),
    db: Client = Depends(get_supabase),
    user: Optional[Any] = Depends(get_optional_user),
):
    query = db.table("gallery").select("*, event:events(title_en, title_ne)")
    if not gallery_router.show_hidden(all, user, db):  # type: ignore[attr-defined]
        query = query.eq("is_published", True)
    if category:
        query = query.eq("category", category)
    return (
        query.order("sort_order").order("created_at", desc=True)
        .range(offset, offset + limit - 1).execute().data
    )
