# backend/app/schemas/content.py
# Schemas for the smaller content tables added/extended in database/schema_v2.sql:
# archanas, calendar_events, temple_info.
# Each resource has Create (POST body), Update (PATCH body, all optional) and
# Response (row as returned by the API) models, like the other schema modules.

from datetime import date, datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


# ===========================================================================
# Archanas — flower offerings shown on /poojas
# ===========================================================================
class ArchanaCreate(BaseModel):
    name_en: str = Field(..., min_length=2, max_length=200)
    name_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    deity_en: Optional[str] = None
    deity_ne: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: str = "NPR"
    is_available: bool = True
    sort_order: int = 0


class ArchanaUpdate(BaseModel):
    name_en: Optional[str] = Field(None, min_length=2, max_length=200)
    name_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    deity_en: Optional[str] = None
    deity_ne: Optional[str] = None
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    is_available: Optional[bool] = None
    sort_order: Optional[int] = None


class ArchanaResponse(ArchanaCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Calendar events — festivals, Ekadashi, Purnima… for the month view
# ===========================================================================
CalendarCategory = Literal[
    "festival", "ekadashi", "purnima", "amavasya", "sankranti", "special_pooja", "other"
]


class CalendarEventCreate(BaseModel):
    event_date: date
    end_date: Optional[date] = None
    category: CalendarCategory = "festival"
    title_en: str = Field(..., min_length=2, max_length=300)
    title_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    tithi_en: Optional[str] = None
    tithi_ne: Optional[str] = None
    bs_date_en: Optional[str] = None   # Bikram Sambat label, e.g. "Asoj 12, 2083"
    bs_date_ne: Optional[str] = None   # e.g. "असोज १२, २०८३"
    is_major: bool = False
    event_id: Optional[UUID] = None
    is_published: bool = True

    @model_validator(mode="after")
    def end_after_start(self):
        if self.end_date and self.end_date < self.event_date:
            raise ValueError("end_date must be on or after event_date")
        return self


class CalendarEventUpdate(BaseModel):
    event_date: Optional[date] = None
    end_date: Optional[date] = None
    category: Optional[CalendarCategory] = None
    title_en: Optional[str] = Field(None, min_length=2, max_length=300)
    title_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    tithi_en: Optional[str] = None
    tithi_ne: Optional[str] = None
    bs_date_en: Optional[str] = None
    bs_date_ne: Optional[str] = None
    is_major: Optional[bool] = None
    event_id: Optional[UUID] = None
    is_published: Optional[bool] = None


class CalendarEventResponse(CalendarEventCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    # Rows are already validated on write; don't re-check on read.
    @model_validator(mode="after")
    def end_after_start(self):
        return self


# ===========================================================================
# Temple info — bilingual key/value facts (timings, contact, history…)
# ===========================================================================
TempleInfoCategory = Literal["timings", "contact", "history", "rituals", "general"]


class TempleInfoCreate(BaseModel):
    key: str = Field(..., min_length=2, max_length=100, pattern=r"^[a-z0-9_.]+$")
    category: TempleInfoCategory = "general"
    value_en: Optional[str] = None
    value_ne: Optional[str] = None
    sort_order: int = 0


class TempleInfoUpdate(BaseModel):
    category: Optional[TempleInfoCategory] = None
    value_en: Optional[str] = None
    value_ne: Optional[str] = None
    sort_order: Optional[int] = None


class TempleInfoResponse(TempleInfoCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ===========================================================================
# Gallery — photos in the public 'gallery' Storage bucket
# ===========================================================================
GalleryCategory = Literal["temple", "deity", "festival", "pooja", "community", "history", "other"]


def _check_image_url(v: Optional[str]) -> Optional[str]:
    """Allow absolute http(s) URLs (Supabase Storage) or site-relative paths like /images/x.jpg."""
    if v is None:
        return v
    v = v.strip()
    if not (v.startswith("https://") or v.startswith("http://") or (v.startswith("/") and not v.startswith("//"))):
        raise ValueError("image_url must be an http(s) URL or a site-relative path starting with /")
    return v


class GalleryCreate(BaseModel):
    image_url: str = Field(..., min_length=2, max_length=1000)
    storage_path: Optional[str] = Field(None, max_length=500)   # path inside the bucket, for deletion
    caption_en: Optional[str] = Field(None, max_length=500)
    caption_ne: Optional[str] = Field(None, max_length=500)
    category: GalleryCategory = "temple"
    event_id: Optional[UUID] = None
    taken_on: Optional[date] = None
    sort_order: int = 0
    is_published: bool = True

    _url = field_validator("image_url")(_check_image_url)


class GalleryUpdate(BaseModel):
    image_url: Optional[str] = Field(None, min_length=2, max_length=1000)
    storage_path: Optional[str] = Field(None, max_length=500)
    caption_en: Optional[str] = Field(None, max_length=500)
    caption_ne: Optional[str] = Field(None, max_length=500)
    category: Optional[GalleryCategory] = None
    event_id: Optional[UUID] = None
    taken_on: Optional[date] = None
    sort_order: Optional[int] = None
    is_published: Optional[bool] = None

    _url = field_validator("image_url")(_check_image_url)


class GalleryEventSummary(BaseModel):
    title_en: str
    title_ne: Optional[str] = None


class GalleryResponse(GalleryCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime
    event: Optional[GalleryEventSummary] = None   # joined from events when event_id is set

    model_config = ConfigDict(from_attributes=True)
