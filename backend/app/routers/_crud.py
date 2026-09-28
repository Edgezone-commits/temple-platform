# backend/app/routers/_crud.py
# Small factory for the "plain content table" routers (archanas, calendar,
# temple info, and later gallery / leadership) so each one doesn't repeat the
# same ~100 lines of list/get/create/update/delete.
#
# Conventions (same as the hand-written events/poojas/books routers):
#   GET    /{prefix}/           public; only visible rows unless ?all=true by an admin
#   GET    /{prefix}/{id}       public for visible rows, admins see everything
#   POST   /{prefix}/           admin
#   PATCH  /{prefix}/{id}       admin (partial update)
#   DELETE /{prefix}/{id}       admin (soft-delete if soft_delete_field, else hard delete)
#
# A caller can pass include_list=False and write its own list endpoint when it
# needs custom filters (e.g. the calendar's date range).

from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from app.auth import get_optional_user, is_admin_user, require_admin
from app.database import get_supabase, fetch_one


def crud_router(
    *,
    table: str,
    prefix: str,
    tag: str,
    create_model: type[BaseModel],
    update_model: type[BaseModel],
    response_model: type[BaseModel],
    visible_field: Optional[str],          # e.g. "is_published"; None = every row is public
    order_by: list[tuple[str, bool]],      # [(column, descending)]
    soft_delete_field: Optional[str] = None,
    include_list: bool = True,
    label: str = "Item",
) -> APIRouter:
    router = APIRouter(prefix=prefix, tags=[tag])

    def show_hidden(all_: bool, user: Optional[Any], db: Client) -> bool:
        if not all_:
            return False
        if not is_admin_user(user, db):
            raise HTTPException(403, "Admin access required for all=true")
        return True

    if include_list:
        @router.get("/", response_model=list[response_model])
        def list_items(
            all: bool = Query(False, description="Admins: include hidden rows"),
            limit: int = Query(100, ge=1, le=500),
            offset: int = Query(0, ge=0),
            db: Client = Depends(get_supabase),
            user: Optional[Any] = Depends(get_optional_user),
        ):
            query = db.table(table).select("*")
            if visible_field and not show_hidden(all, user, db):
                query = query.eq(visible_field, True)
            for col, desc in order_by:
                query = query.order(col, desc=desc)
            return query.range(offset, offset + limit - 1).execute().data

    @router.get("/{item_id}", response_model=response_model)
    def get_item(
        item_id: UUID,
        db: Client = Depends(get_supabase),
        user: Optional[Any] = Depends(get_optional_user),
    ):
        row = fetch_one(db.table(table).select("*").eq("id", str(item_id)))
        hidden = row and visible_field and not row.get(visible_field)
        if not row or (hidden and not is_admin_user(user, db)):
            raise HTTPException(404, f"{label} not found")
        return row

    @router.post("/", response_model=response_model, status_code=201, dependencies=[Depends(require_admin)])
    def create_item(payload: create_model, db: Client = Depends(get_supabase)):  # type: ignore[valid-type]
        result = db.table(table).insert(payload.model_dump(mode="json", exclude_none=True)).execute()
        if not result.data:
            raise HTTPException(500, f"Failed to create {label.lower()}")
        return result.data[0]

    @router.patch("/{item_id}", response_model=response_model, dependencies=[Depends(require_admin)])
    def update_item(item_id: UUID, payload: update_model, db: Client = Depends(get_supabase)):  # type: ignore[valid-type]
        data = payload.model_dump(mode="json", exclude_unset=True)
        if not data:
            raise HTTPException(400, "No fields to update")
        result = db.table(table).update(data).eq("id", str(item_id)).execute()
        if not result.data:
            raise HTTPException(404, f"{label} not found")
        return result.data[0]

    @router.delete("/{item_id}", status_code=204, dependencies=[Depends(require_admin)])
    def delete_item(item_id: UUID, db: Client = Depends(get_supabase)):
        if soft_delete_field:
            result = db.table(table).update({soft_delete_field: False}).eq("id", str(item_id)).execute()
        else:
            result = db.table(table).delete().eq("id", str(item_id)).execute()
        if not result.data:
            raise HTTPException(404, f"{label} not found")

    # Expose for callers that write a custom list endpoint.
    router.show_hidden = show_hidden  # type: ignore[attr-defined]
    return router
