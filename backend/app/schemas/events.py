# backend/app/schemas/events.py

from datetime import date, time, datetime
from typing import Literal, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


# Matches the Festivals / Ekadashi / Purnima / Special Poojas filter on /events.
EventCategory = Literal["festival", "ekadashi", "purnima", "special_pooja", "other"]


# ---------------------------------------------------------------------------
# Base (shared fields)
# ---------------------------------------------------------------------------
class EventBase(BaseModel):
    title_en: str = Field(..., min_length=2, max_length=300)
    title_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    event_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_en: Optional[str] = None
    location_ne: Optional[str] = None
    image_url: Optional[str] = None
    category: EventCategory = "festival"
    is_featured: bool = False
    is_active: bool = True


# ---------------------------------------------------------------------------
# Create — what the client POSTs
# ---------------------------------------------------------------------------
class EventCreate(EventBase):
    pass


# ---------------------------------------------------------------------------
# Update — all fields optional (PATCH semantics)
# ---------------------------------------------------------------------------
class EventUpdate(BaseModel):
    title_en: Optional[str] = Field(None, min_length=2, max_length=300)
    title_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    event_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    location_en: Optional[str] = None
    location_ne: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[EventCategory] = None
    is_featured: Optional[bool] = None
    is_active: Optional[bool] = None


# ---------------------------------------------------------------------------
# Response — what the API returns
# ---------------------------------------------------------------------------
class EventResponse(EventBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)