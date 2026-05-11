"""Train Phase-6 models: IsolationForest (anomaly) + RandomForestRegressor (overrun).

Run:
    python train_model.py --data data/synthetic_transactions.csv --out models/
"""
from __future__ import annotations
import argparse
import os
import json
import joblib

import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.metrics import (
    classification_report, confusion_matrix,
    mean_absolute_error, r2_score,
)
from sklearn.model_selection import train_test_split

from preprocessing import load_dataset, encode_features


def train_anomaly(X, y, contamination: float = 0.03):
    model = IsolationForest(
        n_estimators=200, contamination=contamination, random_state=42, n_jobs=-1,
    )
    model.fit(X)
    pred = (model.predict(X) == -1).astype(int)  # 1 = anomaly
    metrics = {
        "confusion_matrix": confusion_matrix(y, pred).tolist(),
        "report": classification_report(y, pred, output_dict=True, zero_division=0),
        "anomaly_rate": float(pred.mean()),
    }
    return model, metrics


def train_overrun(df, X) -> tuple[RandomForestRegressor, dict]:
    # Target: spend_to_allocation_ratio (proxy for overrun risk).
    y = (df["expense_amount"] / df["allocated_funds"].replace(0, np.nan)).fillna(0).clip(0, 5)
    Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=42)
    model = RandomForestRegressor(n_estimators=250, max_depth=14, random_state=42, n_jobs=-1)
    model.fit(Xtr, ytr)
    pred = model.predict(Xte)
    metrics = {
        "mae": float(mean_absolute_error(yte, pred)),
        "r2": float(r2_score(yte, pred)),
        "feature_importances_top10": (
            sorted(
                list(zip(X.columns.tolist(), model.feature_importances_.tolist())),
                key=lambda kv: kv[1], reverse=True,
            )[:10]
        ),
    }
    return model, metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="data/synthetic_transactions.csv")
    parser.add_argument("--out", default="models")
    args = parser.parse_args()

    os.makedirs(args.out, exist_ok=True)
    df = load_dataset(args.data)
    X, feature_names = encode_features(df)

    print("Training IsolationForest…")
    iso, iso_metrics = train_anomaly(X.values, df["anomaly_flag"].astype(int).values)
    joblib.dump({"model": iso, "feature_names": feature_names},
                os.path.join(args.out, "isolation_forest.joblib"))

    print("Training RandomForestRegressor…")
    rfr, rfr_metrics = train_overrun(df, X)
    joblib.dump({"model": rfr, "feature_names": feature_names},
                os.path.join(args.out, "rf_overrun.joblib"))

    metrics = {"isolation_forest": iso_metrics, "rf_overrun": rfr_metrics}
    with open(os.path.join(args.out, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2, default=str)

    print("Done. Saved to:", args.out)
    print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk in ("anomaly_rate", "mae", "r2")}
                      for k, v in metrics.items()}, indent=2))


if __name__ == "__main__":
    main()
