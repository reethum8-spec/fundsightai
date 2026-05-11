"""Inference helpers consumed by the Flask backend in Phase 6.

Skeleton — wired into `backend/routes/ai.py` once models are trained.
"""
from __future__ import annotations
import os
import joblib
import pandas as pd

from preprocessing import encode_features, add_engineered_features


_MODELS: dict[str, dict] = {}
MODELS_DIR = os.getenv("FS_MODELS_DIR", "models")


def _load(name: str) -> dict:
    if name not in _MODELS:
        path = os.path.join(MODELS_DIR, f"{name}.joblib")
        _MODELS[name] = joblib.load(path)
    return _MODELS[name]


def _align(df: pd.DataFrame, feature_names: list[str]) -> pd.DataFrame:
    X, _ = encode_features(df)
    for col in feature_names:
        if col not in X.columns:
            X[col] = 0
    return X[feature_names]


def detect_anomalies(records: list[dict]) -> list[dict]:
    bundle = _load("isolation_forest")
    df = pd.DataFrame(records)
    X = _align(df, bundle["feature_names"])
    pred = bundle["model"].predict(X)
    score = bundle["model"].score_samples(X)
    out = []
    for r, p, s in zip(records, pred, score):
        out.append({**r, "anomaly": bool(p == -1), "anomaly_score": float(s)})
    return out


def predict_overrun(records: list[dict]) -> list[dict]:
    bundle = _load("rf_overrun")
    df = pd.DataFrame(records)
    X = _align(df, bundle["feature_names"])
    pred = bundle["model"].predict(X)
    return [{**r, "predicted_spend_to_allocation": float(p)} for r, p in zip(records, pred)]


def recommendations_for(record: dict) -> list[str]:
    """Lightweight rule-based engine — extended in Phase 6 with ML signals."""
    tips: list[str] = []
    amount = float(record.get("expense_amount", 0))
    income = float(record.get("income", 1) or 1)
    ratio = amount / income
    if ratio > 0.4:
        tips.append("Single transaction exceeds 40% of monthly income — consider deferring.")
    if record.get("expense_category") == "subscriptions" and amount > 500:
        tips.append("Audit subscriptions for overlap or unused tools.")
    if record.get("user_type") == "ngo" and record.get("expense_category") == "operations":
        tips.append("High operations ratio reduces direct-impact percentage.")
    return tips
