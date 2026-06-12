# backend/app/routers/books.py
# CRUD for temple books (PDFs) and bhajans (audio).

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from supabase import Client

from app.database import get_supabase
from app.schemas.books import (
    BookCreate, BookUpdate, BookResponse,
    BhajanCreate, BhajanUpdate, BhajanResponse,
)

router = APIRouter(tags=["Library"])


# ===========================================================================
# BOOKS  — /books
# ===========================================================================
book_router = APIRouter(prefix="/books")


@book_router.get("/", response_model=list[BookResponse])
def list_books(
    category: str = Query(None, description="Filter by category"),
    language: str = Query(None, description="Filter by language code"),
    limit: int  = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client  = Depends(get_supabase),
):
    query = (
        db.table("books")
        .select("*")
        .eq("is_published", True)
        .order("sort_order")
        .range(offset, offset + limit - 1)
    )
    if category:
        query = query.eq("category", category)
    if language:
        query = query.eq("language", language)
    return query.execute().data


@book_router.get("/{book_id}", response_model=BookResponse)
def get_book(book_id: UUID, db: Client = Depends(get_supabase)):
    result = db.table("books").select("*").eq("id", str(book_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Book not found")
    return result.data


@book_router.post("/", response_model=BookResponse, status_code=201)
def create_book(payload: BookCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(exclude_none=True)
    result = db.table("books").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create book")
    return result.data[0]


@book_router.patch("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: UUID, payload: BookUpdate, db: Client = Depends(get_supabase)
):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    result = db.table("books").update(data).eq("id", str(book_id)).execute()
    if not result.data:
        raise HTTPException(404, "Book not found")
    return result.data[0]


@book_router.delete("/{book_id}", status_code=204)
def delete_book(book_id: UUID, db: Client = Depends(get_supabase)):
    db.table("books").update({"is_published": False}).eq("id", str(book_id)).execute()


# ===========================================================================
# BHAJANS  — /bhajans
# ===========================================================================
bhajan_router = APIRouter(prefix="/bhajans")


@bhajan_router.get("/", response_model=list[BhajanResponse])
def list_bhajans(
    deity: str    = Query(None, description="Filter by deity"),
    category: str = Query(None, description="Filter by category"),
    limit: int  = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client  = Depends(get_supabase),
):
    query = (
        db.table("bhajans")
        .select("*")
        .eq("is_published", True)
        .order("sort_order")
        .range(offset, offset + limit - 1)
    )
    if deity:
        query = query.eq("deity", deity)
    if category:
        query = query.eq("category", category)
    return query.execute().data


@bhajan_router.get("/{bhajan_id}", response_model=BhajanResponse)
def get_bhajan(bhajan_id: UUID, db: Client = Depends(get_supabase)):
    result = db.table("bhajans").select("*").eq("id", str(bhajan_id)).single().execute()
    if not result.data:
        raise HTTPException(404, "Bhajan not found")
    return result.data


@bhajan_router.post("/", response_model=BhajanResponse, status_code=201)
def create_bhajan(payload: BhajanCreate, db: Client = Depends(get_supabase)):
    data = payload.model_dump(exclude_none=True)
    result = db.table("bhajans").insert(data).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create bhajan")
    return result.data[0]


@bhajan_router.patch("/{bhajan_id}", response_model=BhajanResponse)
def update_bhajan(
    bhajan_id: UUID, payload: BhajanUpdate, db: Client = Depends(get_supabase)
):
    data = payload.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(400, "No fields to update")
    result = db.table("bhajans").update(data).eq("id", str(bhajan_id)).execute()
    if not result.data:
        raise HTTPException(404, "Bhajan not found")
    return result.data[0]


@bhajan_router.delete("/{bhajan_id}", status_code=204)
def delete_bhajan(bhajan_id: UUID, db: Client = Depends(get_supabase)):
    db.table("bhajans").update({"is_published": False}).eq("id", str(bhajan_id)).execute()


# Merge both routers
router.include_router(book_router)
router.include_router(bhajan_router)