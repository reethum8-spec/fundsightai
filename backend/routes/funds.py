"""Funds (a.k.a. projects) CRUD.

Hybrid mode:
  - Reads: in mock mode return from `mock_store`; in live mode the frontend
    typically reads via Supabase JS directly. This endpoint is still provided
    for server-side consumers (reports, AI).
  - Writes: validated server-side, then persisted via Supabase admin client
    (live) or `mock_store` (mock). All writes require a valid Supabase JWT.
"""
from flask import Blueprint, g, jsonify, request

from config import Config
from services import mock_store, db
from services.auth import require_auth
from services.validation import ValidationError, fund_create, fund_update

bp = Blueprint("funds", __name__)
TABLE = "projects"


def _err(status: int, **payload):
    return jsonify(payload), status


@bp.get("")
def list_funds():
    if Config.USE_MOCK:
        return jsonify(mock_store.list_funds())
    rows = db.select(TABLE, order=("created_at", True))
    return jsonify(rows)


@bp.get("/<fund_id>")
def get_fund(fund_id):
    if Config.USE_MOCK:
        f = mock_store.get_fund(fund_id)
        return jsonify(f) if f else _err(404, error="not_found")
    rows = db.select(TABLE, eq={"id": fund_id}, limit=1)
    return (jsonify(rows[0]) if rows else _err(404, error="not_found"))


@bp.post("")
@require_auth()
def create_fund():
    raw = request.get_json(silent=True) or {}
    try:
        payload = fund_create(raw)
    except ValidationError as ve:
        return _err(422, error="validation_failed", fields=ve.errors)

    if Config.USE_MOCK:
        created = mock_store.create_fund(payload)
        mock_store.audit({"action": "fund_create", "actor": g.user.get("id"), "target_id": created["id"]})
        return jsonify(created), 201

    payload["owner_id"] = g.user["id"]
    created = db.insert(TABLE, payload)
    return jsonify(created), 201


@bp.put("/<fund_id>")
@require_auth()
def update_fund(fund_id):
    raw = request.get_json(silent=True) or {}
    try:
        payload = fund_update(raw)
    except ValidationError as ve:
        return _err(422, error="validation_failed", fields=ve.errors)

    if Config.USE_MOCK:
        f = mock_store.update_fund(fund_id, payload)
        if f:
            mock_store.audit({"action": "fund_update", "actor": g.user.get("id"), "target_id": fund_id})
        return jsonify(f) if f else _err(404, error="not_found")

    row = db.update(TABLE, fund_id, payload)
    return jsonify(row) if row else _err(404, error="not_found")


@bp.delete("/<fund_id>")
@require_auth(roles=["org_admin", "super_admin"])
def delete_fund(fund_id):
    if Config.USE_MOCK:
        ok = mock_store.delete_fund(fund_id)
        if ok:
            mock_store.audit({"action": "fund_delete", "actor": g.user.get("id"), "target_id": fund_id})
    else:
        ok = db.delete(TABLE, fund_id)
    return jsonify(ok=True) if ok else _err(404, error="not_found")
