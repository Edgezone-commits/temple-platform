# backend/app/schemas/poojas.py

from datetime import date, time, datetime
from typing import Optional, Literal
from uuid import UUID
from pydantic import BaseModel, Field, EmailStr

# ===========================================================================
# Pooja Service
# ===========================================================================
class PoojaBase(BaseModel):
    name_en: str = Field(..., min_length=2, max_length=200)
    name_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0)
    currency: str = "NPR"
    is_available: bool = True
    image_url: Optional[str] = None
    sort_order: int = 0

class PoojaCreate(PoojaBase):
    pass

class PoojaUpdate(BaseModel):
    name_en: Optional[str] = Field(None, min_length=2, max_length=200)
    name_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None

class PoojaResponse(PoojaBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ===========================================================================
# Pooja Booking
# ===========================================================================
BookingStatus = Literal["pending", "confirmed", "cancelled", "completed"]

class BookingBase(BaseModel):
    pooja_id: Optional[UUID] = None
    devotee_name: str = Field(..., min_length=2, max_length=200)
    devotee_email: Optional[EmailStr] = None
    devotee_phone: str = Field(..., min_length=7, max_length=20)
    booking_date: date
    booking_time: Optional[time] = None
    gothram: Optional[str] = None
    nakshatra: Optional[str] = None
    rashi: Optional[str] = None
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    status: Optional[BookingStatus] = None
    booking_date: Optional[date] = None
    booking_time: Optional[time] = None
    notes: Optional[str] = None

class BookingResponse(BookingBase):
    id: UUID
    status: BookingStatus
    created_at: datetime
    updated_at: datetime
    pooja: Optional[PoojaResponse] = None

    class Config:
        from_attributes = True