"""Expense CRUD + CSV bulk import (stub for Phase 5).

Live writes route through `services.db` (Supabase admin) after validation.
"""
import csv
import io
from flask import Blueprint, g, jsonify, request

from config import Config
from services import mock_store, db
from services.auth import require_auth
from services.validation import ValidationError, expense_create


# Map common CSV header aliases (TitleCase, snake_case variants) onto the
# canonical field names accepted by `expense_create`. Lowercased on lookup.
_HEADER_ALIASES = {
    "date": "occurred_at",
    "occurred_at": "occurred_at",
    "occurred at": "occurred_at",
    "amount": "amount",
    "value": "amount",
    "category": "category",
    "description": "description",
    "desc": "description",
    "payment_method": "payment_method",
    "paymentmethod": "payment_method",
    "payment method": "payment_method",
    "method": "payment_method",
    "location": "location",
    "beneficiary": "beneficiary",
    "project_id": "project_id",
    "user_type": "user_type",  # informational only — ignored by validator
    "usertype": "user_type",
}

# Loose payment-method synonyms → canonical PAYMENT_METHODS entry.
_METHOD_ALIASES = {
    "card": "card",
    "credit": "card",
    "credit card": "card",
    "debit": "card",
    "debit card": "card",
    "cash": "cash",
    "wallet": "wallet",
    "paytm": "wallet",
    "phonepe": "wallet",
    "gpay": "upi",
    "googlepay": "upi",
    "google pay": "upi",
    "upi": "upi",
    "netbanking": "netbanking",
    "net banking": "netbanking",
    "bank transfer": "bank_transfer",
    "banktransfer": "bank_transfer",
    "bank_transfer": "bank_transfer",
    "neft": "bank_transfer",
    "rtgs": "bank_transfer",
    "imps": "bank_transfer",
    "cheque": "check",
    "check": "check",
}


def _normalize_row(row: dict) -> dict:
    """Lowercase + alias the keys of a CSV row and tidy the payment method."""
    out: dict = {}
    for k, v in row.items():
        if k is None:
            continue
        canonical = _HEADER_ALIASES.get(k.strip().lower())
        if canonical:
            out[canonical] = v
    method = out.get("payment_method")
    if isinstance(method, str):
        out["payment_method"] = _METHOD_ALIASES.get(method.strip().lower(), method.strip().lower())
    out.pop("user_type", None)  # not part of the expense schema
    return out

bp = Blueprint("expenses", __name__)
TABLE = "expenses"


def _err(status: int, **payload):
    return jsonify(payload), status


@bp.get("")
def list_expenses():
    filters = {
        "category": request.args.get("category"),
        "from": request.args.get("from"),
        "to": request.args.get("to"),
    }
    if Config.USE_MOCK:
        return jsonify(mock_store.list_expenses(filters))

    eq = {}
    if filters["category"]:
        eq["category"] = filters["category"]
    rows = db.select(TABLE, eq=eq, order=("occurred_at", True))
    if filters["from"]:
        rows = [r for r in rows if (r.get("occurred_at") or "") >= filters["from"]]
    if filters["to"]:
        rows = [r for r in rows if (r.get("occurred_at") or "") <= filters["to"]]
    return jsonify(rows)


@bp.get("/<eid>")
def get_expense(eid):
    if Config.USE_MOCK:
        e = mock_store.get_expense(eid)
        return jsonify(e) if e else _err(404, error="not_found")
    rows = db.select(TABLE, eq={"id": eid}, limit=1)
    return (jsonify(rows[0]) if rows else _err(404, error="not_found"))


@bp.post("")
@require_auth()
def create_expense():
    raw = request.get_json(silent=True) or {}
    try:
        payload = expense_create(raw)
    except ValidationError as ve:
        return _err(422, error="validation_failed", fields=ve.errors)

    if Config.USE_MOCK:
        created = mock_store.create_expense(payload)
        mock_store.audit({"action": "expense_create", "actor": g.user.get("id"), "target_id": created["id"]})
        return jsonify(created), 201

    payload["user_id"] = g.user["id"]
    created = db.insert(TABLE, payload)
    return jsonify(created), 201


@bp.put("/<eid>")
@require_auth()
def update_expense(eid):
    raw = request.get_json(silent=True) or {}
    # Reuse create-validator but allow missing fields by filling sentinels.
    try:
        payload = expense_create({**{
            "amount": raw.get("amount", 0),
            "category": raw.get("category") or "Other",
        }, **raw})
        # Strip sentinels the user didn't actually provide.
        if "amount" not in raw: payload.pop("amount", None)
        if "category" not in raw: payload.pop("category", None)
    except ValidationError as ve:
        return _err(422, error="validation_failed", fields=ve.errors)

    if Config.USE_MOCK:
        e = mock_store.update_expense(eid, payload)
        if e:
            mock_store.audit({"action": "expense_update", "actor": g.user.get("id"), "target_id": eid})
        return jsonify(e) if e else _err(404, error="not_found")

    row = db.update(TABLE, eid, payload)
    return jsonify(row) if row else _err(404, error="not_found")


@bp.delete("/<eid>")
@require_auth(roles=["org_admin", "super_admin"])
def delete_expense(eid):
    if Config.USE_MOCK:
        ok = mock_store.delete_expense(eid)
        if ok:
            mock_store.audit({"action": "expense_delete", "actor": g.user.get("id"), "target_id": eid})
    else:
        ok = db.delete(TABLE, eid)
    return jsonify(ok=True) if ok else _err(404, error="not_found")


# ---------------- CSV bulk import (Phase 5 will add receipt parsing) ----------------
@bp.post("/import")
@require_auth()
def import_csv():
    """Accept a CSV upload (multipart 'file' or raw body) and create expenses.

    Returns: { inserted: int, errors: [{row, fields}], total: int }
    """
    if "file" in request.files:
        text = request.files["file"].read().decode("utf-8", errors="replace")
    else:
        text = request.get_data(as_text=True) or ""
    if not text.strip():
        return _err(400, error="empty_body")

    reader = csv.DictReader(io.StringIO(text))
    headers = {h.strip().lower() for h in (reader.fieldnames or []) if h}
    canonical = {_HEADER_ALIASES[h] for h in headers if h in _HEADER_ALIASES}
    missing = {"amount", "category"} - canonical
    if missing:
        return _err(400, error="invalid_headers", missing=sorted(missing),
                    expected=["Date", "Amount", "Category", "Description",
                              "PaymentMethod", "UserType"])

    inserted = 0
    errors: list[dict] = []
    for idx, row in enumerate(reader, start=2):  # row 1 is header
        try:
            payload = expense_create(_normalize_row(row))
            if Config.USE_MOCK:
                mock_store.create_expense(payload)
            else:
                payload["user_id"] = g.user["id"]
                db.insert(TABLE, payload)
            inserted += 1
        except ValidationError as ve:
            errors.append({"row": idx, "fields": ve.errors})
        except Exception as e:  # noqa: BLE001
            errors.append({"row": idx, "error": str(e)})

    return jsonify(inserted=inserted, errors=errors, total=inserted + len(errors))
