"""Lightweight payload validation for Phase 3 writes.

Avoids pulling Pydantic; uses stdlib dataclasses + manual coercion. Each
schema returns a normalized `dict` ready to insert, or raises `ValidationError`
which the route handler turns into a 422 response.
"""
from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any


class ValidationError(ValueError):
    def __init__(self, errors: dict[str, str]):
        super().__init__("validation_failed")
        self.errors = errors


# ---------------- Helpers ----------------
def _str(v: Any, *, max_len: int = 500, required: bool = True, default: str = "") -> str | None:
    if v is None or v == "":
        if required:
            raise ValueError("required")
        return default
    s = str(v).strip()
    if len(s) > max_len:
        raise ValueError(f"max length {max_len}")
    return s


def _num(v: Any, *, min_v: float = 0.0, required: bool = True) -> float | None:
    if v is None or v == "":
        if required:
            raise ValueError("required")
        return None
    try:
        n = float(v)
    except (TypeError, ValueError) as e:
        raise ValueError("must be a number") from e
    if n < min_v:
        raise ValueError(f"must be >= {min_v}")
    return n


def _int(v: Any, *, min_v: int = 0, required: bool = False, default: int = 0) -> int:
    if v is None or v == "":
        if required:
            raise ValueError("required")
        return default
    try:
        n = int(v)
    except (TypeError, ValueError) as e:
        raise ValueError("must be an integer") from e
    if n < min_v:
        raise ValueError(f"must be >= {min_v}")
    return n


def _date(v: Any, *, required: bool = False) -> str | None:
    if v is None or v == "":
        if required:
            raise ValueError("required")
        return None
    if isinstance(v, (date, datetime)):
        return v.date().isoformat() if isinstance(v, datetime) else v.isoformat()
    try:
        return datetime.fromisoformat(str(v)).date().isoformat()
    except ValueError:
        # Accept plain YYYY-MM-DD too
        try:
            return date.fromisoformat(str(v)).isoformat()
        except ValueError as e:
            raise ValueError("must be YYYY-MM-DD") from e


def _enum(v: Any, allowed: set[str], *, required: bool = True, default: str | None = None) -> str | None:
    if v is None or v == "":
        if required:
            raise ValueError("required")
        return default
    s = str(v).strip()
    if s not in allowed:
        raise ValueError(f"must be one of {sorted(allowed)}")
    return s


def _validate(rules: dict[str, callable], payload: dict) -> dict:
    out: dict[str, Any] = {}
    errs: dict[str, str] = {}
    for field, rule in rules.items():
        try:
            out[field] = rule(payload.get(field))
        except ValueError as e:
            errs[field] = str(e)
    if errs:
        raise ValidationError(errs)
    return {k: v for k, v in out.items() if v is not None}


# ---------------- Schemas ----------------
PROJECT_CATEGORIES = {"Education", "Healthcare", "Operations", "R&D", "Outreach", "Other",
                       "Marketing", "Travel", "Equipment", "Salaries", "Subscriptions"}

EXPENSE_CATEGORIES = PROJECT_CATEGORIES | {
    "Donations", "Emergency", "Groceries", "Transport", "Utilities",
    # Indian / personal categories supported by the demo dataset.
    "Food", "Rent", "Shopping", "Office Supplies", "Maintenance",
}

PAYMENT_METHODS = {"card", "bank_transfer", "cash", "wallet", "check", "other",
                   # Common Indian rails — accepted directly without normalisation.
                   "upi", "netbanking"}


def fund_create(payload: dict) -> dict:
    return _validate({
        "project_name":         lambda v: _str(v, max_len=200),
        "category":             lambda v: _enum(v, PROJECT_CATEGORIES),
        "budget":               lambda v: _num(v, min_v=0),
        "expected_impact":      lambda v: _str(v, max_len=2000, required=False, default=""),
        "beneficiaries_count":  lambda v: _int(v, min_v=0, default=0),
        "deadline":             lambda v: _date(v, required=False),
    }, payload)


def fund_update(payload: dict) -> dict:
    """All fields optional for updates; only present fields validated."""
    base = fund_create({**{
        "project_name": payload.get("project_name") or "x",
        "category": payload.get("category") or "Other",
        "budget": payload.get("budget", 0),
    }, **payload})
    # Drop sentinel placeholders if user didn't actually provide them
    if "project_name" not in payload: base.pop("project_name", None)
    if "category" not in payload: base.pop("category", None)
    if "budget" not in payload: base.pop("budget", None)
    return base


def expense_create(payload: dict) -> dict:
    return _validate({
        "amount":           lambda v: _num(v, min_v=0),
        "category":         lambda v: _enum(v, EXPENSE_CATEGORIES),
        "occurred_at":      lambda v: _date(v, required=False) or date.today().isoformat(),
        "description":      lambda v: _str(v, max_len=1000, required=False, default=""),
        "payment_method":   lambda v: _enum(v, PAYMENT_METHODS, required=False, default="card"),
        "location":         lambda v: _str(v, max_len=200, required=False, default=""),
        "beneficiary":      lambda v: _str(v, max_len=200, required=False, default=""),
        "project_id":       lambda v: _str(v, max_len=64, required=False, default=None),
        "receipt_url":      lambda v: _str(v, max_len=1000, required=False, default=None),
    }, payload)
