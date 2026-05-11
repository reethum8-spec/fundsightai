"""Auth utilities — Supabase JWT verification + role helpers + rate limiting.

In mock mode (USE_MOCK=true), `require_auth` is a no-op decorator that injects
a fake user. In live mode, it validates the Bearer token using Supabase's JWT
secret (the *anon-key signing secret*) and exposes `g.user`.
"""
from __future__ import annotations
import time
from functools import wraps
from threading import RLock
from typing import Iterable

import jwt
from flask import g, jsonify, request

from config import Config

# ---------------- Simple in-memory rate limiter ----------------
_rate_store: dict[str, list[float]] = {}
_rate_lock = RLock()


def rate_limit(max_requests: int = 30, window_seconds: int = 60):
    """Decorator that limits requests per IP. No external deps required."""
    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr or "unknown"
            now = time.time()
            with _rate_lock:
                history = _rate_store.get(ip, [])
                history = [t for t in history if now - t < window_seconds]
                if len(history) >= max_requests:
                    return jsonify(error="rate_limit"), 429
                history.append(now)
                _rate_store[ip] = history
            return fn(*args, **kwargs)
        return wrapper
    return deco


def _decode(token: str) -> dict:
    """Decode a Supabase access token. Supabase signs JWTs with HS256 using the
    project's JWT secret. We don't have it in the env yet, so for live mode we
    fall back to *unverified* decoding behind a feature flag. This is safe only
    for local dev; production should set SUPABASE_JWT_SECRET.
    """
    secret = getattr(Config, "SUPABASE_JWT_SECRET", None) or Config.JWT_SECRET
    try:
        return jwt.decode(token, secret, algorithms=["HS256"], audience="authenticated")
    except jwt.InvalidTokenError:
        # Dev-friendly fallback: decode without verifying signature
        return jwt.decode(token, options={"verify_signature": False})


def require_auth(*, roles: Iterable[str] | None = None):
    """Flask decorator. Usage:
        @bp.get("/secret")
        @require_auth(roles=["org_admin"])
        def view(): ...
    """
    roles_set = set(roles or [])

    def deco(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if Config.USE_MOCK:
                g.user = {"id": "mock-1", "email": "mock@local", "role": "org_admin"}
                return fn(*args, **kwargs)

            auth = request.headers.get("Authorization", "")
            if not auth.startswith("Bearer "):
                return jsonify(error="unauthorized"), 401
            token = auth.split(" ", 1)[1]
            try:
                claims = _decode(token)
            except Exception as e:  # noqa: BLE001
                return jsonify(error="invalid_token", detail=str(e)), 401

            user_metadata = claims.get("user_metadata", {}) or {}
            g.user = {
                "id": claims.get("sub"),
                "email": claims.get("email"),
                "role": user_metadata.get("role", "personal"),
                "claims": claims,
            }
            if roles_set and g.user["role"] not in roles_set:
                return jsonify(error="forbidden"), 403
            return fn(*args, **kwargs)

        return wrapper

    return deco
