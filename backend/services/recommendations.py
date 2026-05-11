"""Rule-based recommendation engine that adapts to actual data.

Operates over the active store (mock_store in mock mode, Supabase admin in
live mode) to produce dynamic insights. Designed to gracefully degrade to
demo content when there isn't enough signal.
"""
from __future__ import annotations
import statistics
from collections import defaultdict
from datetime import datetime, timedelta

from config import Config
from services import mock_store


_DEMO = [
    {"id": 1, "type": "recommendation",
     "title": "Consolidate SaaS subscriptions",
     "body": "4 overlapping tools detected — projected savings of \u20B92,56,000/yr."},
    {"id": 2, "type": "alert",
     "title": "Anomaly: travel spend spike",
     "body": "September travel expense is 3.2σ above the 12-month mean."},
    {"id": 3, "type": "forecast",
     "title": "Q4 budget overrun likely",
     "body": "Operations category projected to exceed budget by 8%."},
    {"id": 4, "type": "positive",
     "title": "Impact-to-spend ratio improving",
     "body": "+12% vs last quarter."},
]


def _load_expenses() -> list[dict]:
    if Config.USE_MOCK:
        return mock_store.list_expenses() or []
    try:
        from services import db
        return db.select("expenses", order=("occurred_at", True), limit=2000) or []
    except Exception:
        return []


def _load_funds() -> list[dict]:
    if Config.USE_MOCK:
        return mock_store.list_funds() or []
    try:
        from services import db
        return db.select("projects", order=("created_at", True), limit=500) or []
    except Exception:
        return []


def generate() -> list[dict]:
    """Build a list of insights dynamically. Falls back to demo set when sparse."""
    expenses = _load_expenses()
    funds = _load_funds()

    if len(expenses) < 5:
        return _DEMO

    out: list[dict] = []
    next_id = 1

    # 1) Anomaly via z-score on amounts
    amounts = [float(e.get("amount") or 0) for e in expenses]
    mu = statistics.fmean(amounts)
    sigma = statistics.pstdev(amounts) or 1.0
    flagged = [e for e in expenses if abs((float(e.get("amount") or 0) - mu) / sigma) >= 2.5]
    if flagged:
        top = max(flagged, key=lambda e: float(e.get("amount") or 0))
        out.append({
            "id": next_id, "type": "alert",
            "title": f"Anomaly: {top.get('category', 'transaction')} spike",
            "body": f"{top.get('description') or 'Transaction'} of \u20B9{float(top['amount']):,.0f} "
                    f"is {((float(top['amount']) - mu) / sigma):.1f}\u03c3 above the mean.",
        })
        next_id += 1

    # 2) Category concentration
    by_cat = defaultdict(float)
    for e in expenses:
        by_cat[e.get("category", "Other")] += float(e.get("amount") or 0)
    if by_cat:
        total = sum(by_cat.values())
        top_cat, top_amt = max(by_cat.items(), key=lambda kv: kv[1])
        share = top_amt / total if total else 0
        if share > 0.45:
            out.append({
                "id": next_id, "type": "recommendation",
                "title": f"Spending concentrated in {top_cat}",
                "body": f"{share:.0%} of all spend is in {top_cat}. Consider diversifying or auditing this category.",
            })
            next_id += 1

    # 3) Subscription growth signal
    sub_amt = by_cat.get("Subscriptions", 0)
    if sub_amt > 0 and total > 0 and sub_amt / total > 0.08:
        out.append({
            "id": next_id, "type": "recommendation",
            "title": "Audit subscriptions",
            "body": f"Subscriptions account for \u20B9{sub_amt:,.0f} ({sub_amt / total:.0%}). "
                    f"Look for overlapping or unused tools.",
        })
        next_id += 1

    # 4) Burn rate forecast for top fund
    if funds:
        top_fund = max(funds, key=lambda f: float(f.get("budget") or 0))
        budget = float(top_fund.get("budget") or 0)
        spent = float(top_fund.get("spent") or 0)
        if budget > 0 and spent / budget > 0.7:
            out.append({
                "id": next_id, "type": "forecast",
                "title": f"{top_fund.get('project_name', 'Top project')} burning fast",
                "body": f"{spent / budget:.0%} of budget consumed. "
                        f"At current pace, overrun is likely before deadline.",
            })
            next_id += 1

    # 5) Recent vs prior month trend (positive note)
    now = datetime.utcnow().date()
    cutoff = now - timedelta(days=30)
    prior_cutoff = now - timedelta(days=60)
    recent = sum(float(e.get("amount") or 0) for e in expenses
                 if (e.get("occurred_at") or e.get("date") or "") >= cutoff.isoformat())
    prior = sum(float(e.get("amount") or 0) for e in expenses
                if prior_cutoff.isoformat() <= (e.get("occurred_at") or e.get("date") or "") < cutoff.isoformat())
    if prior > 0:
        delta = (recent - prior) / prior
        if delta < -0.05:
            out.append({
                "id": next_id, "type": "positive",
                "title": "Spend trending down",
                "body": f"Last 30 days are {abs(delta):.0%} lower than the prior 30. Keep it up.",
            })
            next_id += 1
        elif delta > 0.25:
            out.append({
                "id": next_id, "type": "alert",
                "title": "Spend accelerating",
                "body": f"Last 30 days are {delta:.0%} higher than the prior 30. Review for one-offs.",
            })
            next_id += 1

    return out or _DEMO
