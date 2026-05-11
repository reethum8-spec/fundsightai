"""AI endpoints.

Strategy: try real models from `ai_models/` first; fall back to deterministic
rule-based logic if models are missing or sklearn isn't installed. This keeps
the dashboard usable end-to-end at every stage of setup.
"""
import statistics
from flask import Blueprint, jsonify, request

from services import mock_store, ai_engine, recommendations
from services.auth import rate_limit

bp = Blueprint("ai", __name__)


@bp.get("/status")
def status():
    """Surface model availability — useful for the UI to badge live/rule-based."""
    return jsonify(ai_engine.status())


@bp.get("/insights")
def insights():
    return jsonify(recommendations.generate())


# ---------------- Anomaly detection ----------------
def _zscore_fallback(items: list[dict]) -> dict:
    amounts = [float(e.get("amount", 0)) for e in items]
    if len(amounts) < 2:
        return {"flagged": [], "engine": "rule", "reason": "not_enough_data"}
    mu = statistics.fmean(amounts)
    sigma = statistics.pstdev(amounts) or 1.0
    flagged = []
    for e in items:
        z = (float(e.get("amount", 0)) - mu) / sigma
        if abs(z) >= 2.0:
            flagged.append({**e, "z_score": round(z, 2), "reason": "z>=2"})
    return {"flagged": flagged, "mean": mu, "stdev": sigma, "engine": "rule"}


@bp.post("/anomalies")
@rate_limit(max_requests=20, window_seconds=60)
def anomalies():
    payload = request.get_json(silent=True) or {}
    items = payload.get("expenses") or mock_store.list_expenses()
    if not items:
        return jsonify(flagged=[], engine="rule", reason="empty_input")

    if ai_engine.available():
        try:
            scored = ai_engine.detect_anomalies(items)
            flagged = [r for r in scored if r.get("anomaly")]
            return jsonify(flagged=flagged, scored=scored, engine="isolation_forest")
        except Exception as e:  # noqa: BLE001
            return jsonify({**_zscore_fallback(items), "engine_error": str(e)})
    return jsonify(_zscore_fallback(items))


# ---------------- Overrun prediction ----------------
def _burn_rate_fallback(fund: dict, expenses: list[dict]) -> dict:
    spent = sum(float(e["amount"]) for e in expenses) or float(fund.get("spent", 0))
    budget = float(fund["budget"]) or 1.0
    utilization = spent / budget
    projected = utilization * 1.4  # naive linear projection
    overrun_prob = max(0.0, min(1.0, (projected - 1.0) * 1.5 + 0.2))
    return {
        "utilization": round(utilization, 4),
        "projected_utilization": round(projected, 4),
        "overrun_probability": round(overrun_prob, 4),
        "engine": "rule",
    }


@bp.post("/predict-overrun")
@rate_limit(max_requests=20, window_seconds=60)
def predict_overrun():
    payload = request.get_json(silent=True) or {}
    fund_id = payload.get("fund_id")
    fund = mock_store.get_fund(fund_id) if fund_id else None
    if not fund:
        return jsonify(error="fund_not_found"), 404

    expenses = [e for e in mock_store.list_expenses() if e.get("fund_id") == fund_id]
    base = _burn_rate_fallback(fund, expenses)

    # Use Random Forest predictions if available
    if ai_engine.available() and expenses:
        try:
            # Synthesize feature rows expected by the model
            feature_rows = [{
                "user_id": fund.get("id", "unknown"),
                "user_type": "ngo",
                "income": float(fund["budget"]),
                "allocated_funds": float(fund["budget"]),
                "expense_amount": float(e.get("amount", 0)),
                "expense_category": e.get("category", "Other"),
                "project_type": fund.get("category", "Other"),
                "region": "NA",
                "timestamp": e.get("date") or e.get("occurred_at") or "2026-01-01",
                "completion_rate": 0.5,
                "spending_pattern": "steady",
                "transaction_frequency": len(expenses),
                "payment_method": e.get("payment_method", "card"),
            } for e in expenses]

            predictions = ai_engine.predict_overrun(feature_rows)
            preds = [p["predicted_spend_to_allocation"] for p in predictions]
            mean_pred = sum(preds) / len(preds)
            ml_overrun_prob = max(0.0, min(1.0, (mean_pred - 1.0) * 1.5 + 0.2))
            base.update({
                "ml_projected_ratio": round(mean_pred, 4),
                "overrun_probability": round((base["overrun_probability"] + ml_overrun_prob) / 2, 4),
                "engine": "rf+rule",
            })
        except Exception as e:  # noqa: BLE001
            base["engine_error"] = str(e)

    base["fund_id"] = fund_id
    base["recommended_action"] = (
        "Throttle non-essential spend" if base["overrun_probability"] > 0.5
        else "On track — monitor weekly"
    )
    return jsonify(base)
