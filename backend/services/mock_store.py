"""In-memory mock data store for Phase 1.

Replaced by Supabase queries in Phase 3. Keeps a process-local list of
funds and expenses that mirrors the future Postgres schema.
"""
from __future__ import annotations
import uuid
from datetime import datetime, timedelta
from threading import RLock

_lock = RLock()

# ---------------- Users (mock) ----------------
_USERS: list[dict] = [
    {"id": "u-1", "email": "admin@fundsight.local", "name": "Admin User", "role": "org_admin", "created_at": "2026-01-01", "status": "active"},
    {"id": "u-2", "email": "manager@fundsight.local", "name": "Manager", "role": "ngo_manager", "created_at": "2026-02-15", "status": "active"},
    {"id": "u-3", "email": "viewer@fundsight.local", "name": "Viewer", "role": "personal", "created_at": "2026-03-10", "status": "active"},
]

# ---------------- Audit log ----------------
_AUDIT: list[dict] = []

# Six programs totalling ₹2 Cr — mirrors the frontend `demoFunds` exactly so
# live-mode (API-backed) renders the same KPIs as the mock fallback.
_FUNDS: list[dict] = [
    {
        "id": "f-edu", "project_name": "Rural Education Initiative", "category": "Education",
        "budget": 56_00_000, "spent": 33_60_000, "beneficiaries_count": 5200,
        "expected_impact": "Reach 5,200 students across 24 villages",
        "deadline": "2026-12-31",
        "created_at": (datetime.utcnow() - timedelta(days=150)).isoformat(),
    },
    {
        "id": "f-hlt", "project_name": "Mobile Health Clinics", "category": "Healthcare",
        "budget": 42_00_000, "spent": 26_10_000, "beneficiaries_count": 11_800,
        "expected_impact": "Provide care to 12k patients across rural districts",
        "deadline": "2026-09-30",
        "created_at": (datetime.utcnow() - timedelta(days=120)).isoformat(),
    },
    {
        "id": "f-ops", "project_name": "Field Operations", "category": "Operations",
        "budget": 32_00_000, "spent": 21_40_000, "beneficiaries_count": 0,
        "expected_impact": "Logistics + field-staff coordination across regions",
        "deadline": "2026-12-31",
        "created_at": (datetime.utcnow() - timedelta(days=140)).isoformat(),
    },
    {
        "id": "f-rnd", "project_name": "Curriculum R&D", "category": "R&D",
        "budget": 26_00_000, "spent": 14_80_000, "beneficiaries_count": 0,
        "expected_impact": "Develop bilingual STEM curriculum for grades 6–10",
        "deadline": "2026-11-30",
        "created_at": (datetime.utcnow() - timedelta(days=110)).isoformat(),
    },
    {
        "id": "f-out", "project_name": "Community Outreach", "category": "Outreach",
        "budget": 24_00_000, "spent": 14_70_000, "beneficiaries_count": 8_400,
        "expected_impact": "Awareness drives reaching 8,400+ households",
        "deadline": "2026-12-31",
        "created_at": (datetime.utcnow() - timedelta(days=100)).isoformat(),
    },
    {
        "id": "f-oth", "project_name": "Administration & Compliance", "category": "Other",
        "budget": 20_00_000, "spent":  7_90_000, "beneficiaries_count": 0,
        "expected_impact": "Statutory filings, audits and overhead",
        "deadline": "2026-12-31",
        "created_at": (datetime.utcnow() - timedelta(days=160)).isoformat(),
    },
]

# Recent expense ledger (~₹6.4 L across last 7 days) — matches frontend's
# `recentExpenses`. Charged against the larger fund balances above.
_EXPENSES: list[dict] = [
    {"id": "e1", "fund_id": "f-edu", "amount": 3_60_000, "category": "Salaries",
     "date": "2026-05-08", "description": "May payroll — Field staff (8 people)",
     "payment_method": "bank_transfer", "location": "HQ",       "anomaly_flag": False},
    {"id": "e2", "fund_id": "f-out", "amount":   42_000, "category": "Travel",
     "date": "2026-05-07", "description": "Field visit — Region 4 (3 staff)",
     "payment_method": "card",          "location": "Region 4", "anomaly_flag": True},
    {"id": "e3", "fund_id": "f-rnd", "amount":   78_400, "category": "Equipment",
     "date": "2026-05-06", "description": "Laptop replacement — Programs team",
     "payment_method": "card",          "location": "HQ",       "anomaly_flag": False},
    {"id": "e4", "fund_id": "f-oth", "amount":   17_600, "category": "Subscriptions",
     "date": "2026-05-05", "description": "Analytics & CRM monthly",
     "payment_method": "card",          "location": "HQ",       "anomaly_flag": False},
    {"id": "e5", "fund_id": "f-out", "amount":   51_200, "category": "Marketing",
     "date": "2026-05-04", "description": "Awareness campaign — Print",
     "payment_method": "card",          "location": "Region 2", "anomaly_flag": True},
    {"id": "e6", "fund_id": "f-ops", "amount":   92_400, "category": "Operations",
     "date": "2026-05-03", "description": "Vehicle fuel + maintenance",
     "payment_method": "upi",           "location": "Field",    "anomaly_flag": False},
]


# ---------------- Funds ----------------
def list_funds() -> list[dict]:
    with _lock:
        return list(_FUNDS)


def get_fund(fund_id: str) -> dict | None:
    with _lock:
        return next((f for f in _FUNDS if f["id"] == fund_id), None)


def create_fund(payload: dict) -> dict:
    with _lock:
        record = {
            "id": payload.get("id") or f"f-{uuid.uuid4().hex[:8]}",
            "project_name": payload.get("project_name", "Untitled"),
            "category": payload.get("category", "Other"),
            "budget": float(payload.get("budget", 0)),
            "expected_impact": payload.get("expected_impact", ""),
            "beneficiaries_count": int(payload.get("beneficiaries_count", 0)),
            "deadline": payload.get("deadline"),
            "spent": 0.0,
            "created_at": datetime.utcnow().isoformat(),
        }
        _FUNDS.append(record)
        return record


def update_fund(fund_id: str, payload: dict) -> dict | None:
    with _lock:
        f = get_fund(fund_id)
        if not f:
            return None
        f.update({k: v for k, v in payload.items() if k != "id"})
        return f


def delete_fund(fund_id: str) -> bool:
    with _lock:
        before = len(_FUNDS)
        _FUNDS[:] = [f for f in _FUNDS if f["id"] != fund_id]
        return len(_FUNDS) < before


# ---------------- Expenses ----------------
def list_expenses(filters: dict | None = None) -> list[dict]:
    with _lock:
        items = list(_EXPENSES)
    if not filters:
        return items
    cat = filters.get("category")
    if cat:
        items = [e for e in items if e["category"].lower() == cat.lower()]
    frm = filters.get("from")
    if frm:
        items = [e for e in items if e["date"] >= frm]
    to = filters.get("to")
    if to:
        items = [e for e in items if e["date"] <= to]
    return items


def get_expense(eid: str) -> dict | None:
    with _lock:
        return next((e for e in _EXPENSES if e["id"] == eid), None)


def create_expense(payload: dict) -> dict:
    with _lock:
        record = {
            "id": payload.get("id") or f"e-{uuid.uuid4().hex[:8]}",
            "fund_id": payload.get("fund_id"),
            "amount": float(payload.get("amount", 0)),
            "category": payload.get("category", "Other"),
            "date": payload.get("date") or datetime.utcnow().date().isoformat(),
            "description": payload.get("description", ""),
            "payment_method": payload.get("payment_method", "card"),
            "location": payload.get("location", ""),
            "anomaly_flag": bool(payload.get("anomaly_flag", False)),
        }
        _EXPENSES.append(record)
        return record


def update_expense(eid: str, payload: dict) -> dict | None:
    with _lock:
        e = get_expense(eid)
        if not e:
            return None
        e.update({k: v for k, v in payload.items() if k != "id"})
        return e


# ---------------- Reports (metadata) ----------------
_REPORTS: list[dict] = []


def list_reports() -> list[dict]:
    with _lock:
        return sorted(_REPORTS, key=lambda r: r["generated_at"], reverse=True)


def add_report(meta: dict) -> dict:
    with _lock:
        record = {"id": meta.get("id") or f"r-{uuid.uuid4().hex[:8]}", **meta}
        _REPORTS.append(record)
        return record


def get_report(rid: str) -> dict | None:
    with _lock:
        return next((r for r in _REPORTS if r["id"] == rid), None)


# ---------------- Users CRUD ----------------
def list_users() -> list[dict]:
    with _lock:
        return list(_USERS)


def get_user(uid: str) -> dict | None:
    with _lock:
        return next((u for u in _USERS if u["id"] == uid), None)


def update_user(uid: str, payload: dict) -> dict | None:
    with _lock:
        u = get_user(uid)
        if not u:
            return None
        u.update({k: v for k, v in payload.items() if k != "id"})
        return u


def delete_user(uid: str) -> bool:
    with _lock:
        before = len(_USERS)
        _USERS[:] = [u for u in _USERS if u["id"] != uid]
        return len(_USERS) < before


# ---------------- Audit log ----------------
def audit(entry: dict):
    with _lock:
        record = {
            "id": f"a-{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.utcnow().isoformat(),
            **entry,
        }
        _AUDIT.append(record)
        return record


def list_audit(limit: int = 100) -> list[dict]:
    with _lock:
        return list(reversed(_AUDIT[-limit:]))


def delete_expense(eid: str) -> bool:
    with _lock:
        before = len(_EXPENSES)
        _EXPENSES[:] = [e for e in _EXPENSES if e["id"] != eid]
        return len(_EXPENSES) < before
