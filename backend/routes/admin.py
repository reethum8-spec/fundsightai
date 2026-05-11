"""Admin-only endpoints.

All routes are guarded with @require_auth(roles=["super_admin","org_admin"]).
"""
from flask import Blueprint, jsonify, request

from services import mock_store
from services.auth import require_auth

bp = Blueprint("admin", __name__)


# ---------- Users ----------
@bp.get("/users")
@require_auth(roles=["super_admin", "org_admin"])
def list_users():
    return jsonify(mock_store.list_users())


@bp.put("/users/<uid>/role")
@require_auth(roles=["super_admin", "org_admin"])
def set_role(uid):
    body = request.get_json(silent=True) or {}
    role = body.get("role")
    if not role:
        return jsonify(error="role_required"), 400
    u = mock_store.update_user(uid, {"role": role})
    if not u:
        return jsonify(error="not_found"), 404
    mock_store.audit({"action": "role_change", "target_id": uid, "new_role": role})
    return jsonify(u)


@bp.delete("/users/<uid>")
@require_auth(roles=["super_admin"])
def delete_user(uid):
    ok = mock_store.delete_user(uid)
    if not ok:
        return jsonify(error="not_found"), 404
    mock_store.audit({"action": "user_delete", "target_id": uid})
    return jsonify(deleted=True)


# ---------- System metrics ----------
@bp.get("/metrics")
@require_auth(roles=["super_admin", "org_admin"])
def metrics():
    funds = mock_store.list_funds()
    expenses = mock_store.list_expenses()
    users = mock_store.list_users()
    total_budget = sum(float(f.get("budget") or 0) for f in funds)
    total_spent = sum(float(e.get("amount") or 0) for e in expenses)
    flagged = sum(1 for e in expenses if e.get("anomaly_flag") or e.get("flag"))
    return jsonify({
        "users": len(users),
        "funds": len(funds),
        "expenses": len(expenses),
        "total_budget": round(total_budget, 2),
        "total_spent": round(total_spent, 2),
        "remaining": round(max(0, total_budget - total_spent), 2),
        "anomalies": flagged,
        "reports": len(mock_store.list_reports()),
        "audit_entries": len(mock_store.list_audit(99999)),
    })


# ---------- Audit log ----------
@bp.get("/audit")
@require_auth(roles=["super_admin", "org_admin"])
def audit_log():
    limit = request.args.get("limit", 100, type=int)
    return jsonify(mock_store.list_audit(limit))


# ---------- Flagged activity ----------
@bp.get("/flagged")
@require_auth(roles=["super_admin", "org_admin"])
def flagged():
    expenses = mock_store.list_expenses()
    flagged_items = [
        {**e, "reason": "anomaly"}
        for e in expenses
        if e.get("anomaly_flag") or e.get("flag")
    ]
    # Also flag high-value expenses (>3σ would be caught here if we computed it)
    return jsonify(flagged_items)
