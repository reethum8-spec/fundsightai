from flask import Blueprint, g, jsonify
from services.auth import require_auth

bp = Blueprint("me", __name__)


@bp.get("")
@require_auth()
def me():
    return jsonify(g.user)


@bp.get("/admin")
@require_auth(roles=["org_admin", "super_admin"])
def admin_only():
    return jsonify(ok=True, user=g.user, message="Admin access verified.")
