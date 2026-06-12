# backend/app/schemas/books.py

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# ===========================================================================
# Books
# ===========================================================================
class BookBase(BaseModel):
    title_en: str = Field(..., min_length=1, max_length=300)
    title_ne: Optional[str] = None
    author_en: Optional[str] = None
    author_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    pdf_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: Optional[str] = None   # 'scripture', 'stotra', 'biography', 'philosophy'
    language: str = "sa"             # 'sa'=Sanskrit, 'ne'=Nepali, 'en'=English
    total_pages: Optional[int] = None
    is_published: bool = True
    sort_order: int = 0


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title_en: Optional[str] = Field(None, min_length=1, max_length=300)
    title_ne: Optional[str] = None
    author_en: Optional[str] = None
    author_ne: Optional[str] = None
    description_en: Optional[str] = None
    description_ne: Optional[str] = None
    pdf_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    category: Optional[str] = None
    language: Optional[str] = None
    total_pages: Optional[int] = None
    is_published: Optional[bool] = None
    sort_order: Optional[int] = None


class BookResponse(BookBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===========================================================================
# Bhajans
# ===========================================================================
class BhajanBase(BaseModel):
    title_en: str = Field(..., min_length=1, max_length=300)
    title_ne: Optional[str] = None
    artist_en: Optional[str] = None
    artist_ne: Optional[str] = None
    lyrics_en: Optional[str] = None
    lyrics_ne: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    deity: Optional[str] = None      # 'Vishnu', 'Lakshmi', 'Laxminarayan'
    raaga: Optional[str] = None
    category: Optional[str] = None   # 'stotra', 'ashtapadi', 'mangalashtak'
    is_published: bool = True
    sort_order: int = 0


class BhajanCreate(BhajanBase):
    pass


class BhajanUpdate(BaseModel):
    title_en: Optional[str] = Field(None, min_length=1, max_length=300)
    title_ne: Optional[str] = None
    artist_en: Optional[str] = None
    artist_ne: Optional[str] = None
    lyrics_en: Optional[str] = None
    lyrics_ne: Optional[str] = None
    audio_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    deity: Optional[str] = None
    raaga: Optional[str] = None
    category: Optional[str] = None
    is_published: Optional[bool] = None
    sort_order: Optional[int] = None


class BhajanResponse(BhajanBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True