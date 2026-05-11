"""Supabase client singleton (service-role).

Used for backend writes that have already been authenticated via JWT.
Reads should generally happen on the frontend through the user-scoped
anon key (RLS-enforced); the backend uses the admin client only for
writes, validations, and AI-driven inserts.
"""
from __future__ import annotations
from functools import lru_cache
from typing import Any

from config import Config


@lru_cache(maxsize=1)
def get_client():
    """Lazy-initialize a Supabase client. Raises if not configured."""
    if Config.USE_MOCK:
        raise RuntimeError("Supabase client requested while USE_MOCK=true")
    if not Config.SUPABASE_URL or not Config.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for live mode."
        )
    # Imported lazily so mock-mode dev doesn't require the supabase package
    # to be importable (it is, but this keeps a cleaner failure surface).
    from supabase import create_client  # type: ignore
    return create_client(Config.SUPABASE_URL, Config.SUPABASE_SERVICE_ROLE_KEY)


def insert(table: str, payload: dict) -> dict:
    res = get_client().table(table).insert(payload).execute()
    rows = getattr(res, "data", None) or []
    if not rows:
        raise RuntimeError(f"insert into {table} returned no rows")
    return rows[0]


def select(table: str, *, eq: dict[str, Any] | None = None,
           order: tuple[str, bool] | None = None, limit: int | None = None) -> list[dict]:
    q = get_client().table(table).select("*")
    for k, v in (eq or {}).items():
        q = q.eq(k, v)
    if order:
        col, desc = order
        q = q.order(col, desc=desc)
    if limit:
        q = q.limit(limit)
    return getattr(q.execute(), "data", None) or []


def update(table: str, row_id: str, payload: dict) -> dict | None:
    res = get_client().table(table).update(payload).eq("id", row_id).execute()
    rows = getattr(res, "data", None) or []
    return rows[0] if rows else None


def delete(table: str, row_id: str) -> bool:
    res = get_client().table(table).delete().eq("id", row_id).execute()
    rows = getattr(res, "data", None) or []
    return bool(rows)
