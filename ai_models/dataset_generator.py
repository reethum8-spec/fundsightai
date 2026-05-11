"""Synthetic dataset generator for FundSight AI.

Generates a realistic, mixed-population transactions dataset across
NGOs, startups, businesses, education projects, and personal users.

Run:
    python dataset_generator.py --rows 10000 --out data/synthetic_transactions.csv
"""
from __future__ import annotations
import argparse
import os
from dataclasses import dataclass
from datetime import datetime, timedelta

import numpy as np
import pandas as pd


USER_TYPES = ["personal", "ngo", "startup", "business", "education"]

CATEGORY_PROFILES: dict[str, dict[str, tuple[float, float]]] = {
    "personal":   {"groceries": (40, 220), "subscriptions": (5, 60), "transport": (5, 80),
                   "healthcare": (10, 300), "salaries": (1500, 6000), "donations": (10, 150)},
    "ngo":        {"salaries": (1200, 5000), "outreach": (500, 8000), "healthcare": (200, 9000),
                   "education": (300, 9000), "transport": (50, 1200), "emergency": (200, 15000)},
    "startup":    {"salaries": (3000, 15000), "subscriptions": (50, 1500),
                   "marketing": (500, 12000), "equipment": (200, 8000),
                   "operations": (200, 6000), "travel": (50, 4000)},
    "business":   {"salaries": (2500, 12000), "operations": (500, 9000),
                   "equipment": (300, 7000), "marketing": (300, 6000),
                   "travel": (50, 3500), "subscriptions": (50, 1200)},
    "education":  {"salaries": (1500, 7000), "education": (200, 6000),
                   "equipment": (200, 4000), "operations": (100, 3000),
                   "transport": (30, 800), "outreach": (100, 5000)},
}

REGIONS = ["NA", "EU", "LATAM", "MEA", "APAC", "SA"]
PAYMENT_METHODS = ["card", "bank_transfer", "cash", "wallet"]
PROJECT_TYPES = {
    "ngo": ["rural_education", "mobile_clinic", "food_aid", "women_empowerment"],
    "startup": ["product_dev", "growth", "research", "ops_scaleup"],
    "business": ["expansion", "ops", "rebrand", "digital_transformation"],
    "education": ["scholarship", "infra", "curriculum", "outreach"],
    "personal": ["household", "family", "self", "side_project"],
}


@dataclass
class GenConfig:
    rows: int = 10_000
    n_users: int = 600
    seed: int = 7
    out_path: str = "data/synthetic_transactions.csv"
    anomaly_rate: float = 0.03


def _rng(seed: int) -> np.random.Generator:
    return np.random.default_rng(seed)


def _build_users(cfg: GenConfig, rng: np.random.Generator) -> pd.DataFrame:
    user_ids = [f"u_{i:05d}" for i in range(cfg.n_users)]
    user_types = rng.choice(USER_TYPES, size=cfg.n_users, p=[0.35, 0.20, 0.18, 0.15, 0.12])
    incomes = []
    for ut in user_types:
        if ut == "personal":
            incomes.append(rng.normal(4500, 1800))
        elif ut == "ngo":
            incomes.append(rng.normal(35_000, 18_000))
        elif ut == "startup":
            incomes.append(rng.normal(80_000, 50_000))
        elif ut == "business":
            incomes.append(rng.normal(120_000, 60_000))
        else:
            incomes.append(rng.normal(28_000, 12_000))
    incomes = np.clip(incomes, 800, None)

    allocated = incomes * rng.uniform(0.6, 1.6, size=cfg.n_users)
    return pd.DataFrame({
        "user_id": user_ids,
        "user_type": user_types,
        "income": np.round(incomes, 2),
        "allocated_funds": np.round(allocated, 2),
        "region": rng.choice(REGIONS, size=cfg.n_users),
    })


def generate(cfg: GenConfig) -> pd.DataFrame:
    rng = _rng(cfg.seed)
    users = _build_users(cfg, rng)

    user_idx = rng.integers(0, len(users), size=cfg.rows)
    base = users.iloc[user_idx].reset_index(drop=True)

    # Spread timestamps across the last 18 months
    now = datetime.utcnow()
    days_back = rng.integers(0, 540, size=cfg.rows)
    seconds = rng.integers(0, 86_400, size=cfg.rows)
    timestamps = [now - timedelta(days=int(d), seconds=int(s)) for d, s in zip(days_back, seconds)]

    categories: list[str] = []
    amounts: list[float] = []
    project_types: list[str] = []
    for ut in base["user_type"]:
        profile = CATEGORY_PROFILES[ut]
        cats = list(profile.keys())
        cat = rng.choice(cats)
        lo, hi = profile[cat]
        # log-normal-ish amount within [lo, hi]
        amt = float(np.exp(rng.uniform(np.log(lo), np.log(hi))))
        categories.append(cat)
        amounts.append(round(amt, 2))
        project_types.append(rng.choice(PROJECT_TYPES[ut]))

    amounts = np.array(amounts)

    # Inject anomalies (multiply by 4-15x for a small fraction)
    anomaly_mask = rng.random(cfg.rows) < cfg.anomaly_rate
    anomaly_multipliers = rng.uniform(4.0, 15.0, size=cfg.rows)
    amounts = np.where(anomaly_mask, amounts * anomaly_multipliers, amounts)

    transaction_freq = rng.integers(1, 60, size=cfg.rows)
    spending_pattern = rng.choice(
        ["steady", "bursty", "seasonal", "declining", "growing"],
        size=cfg.rows, p=[0.45, 0.18, 0.15, 0.10, 0.12],
    )

    # Impact score and completion (only meaningful for institutions)
    impact_score = np.clip(rng.normal(0.65, 0.18, size=cfg.rows), 0, 1)
    impact_score = np.where(base["user_type"] == "personal", np.nan, impact_score)
    completion_rate = np.clip(rng.beta(5, 2, size=cfg.rows), 0, 1)

    df = pd.DataFrame({
        "user_id": base["user_id"].values,
        "user_type": base["user_type"].values,
        "income": base["income"].values,
        "allocated_funds": base["allocated_funds"].values,
        "expense_amount": np.round(amounts, 2),
        "expense_category": categories,
        "project_type": project_types,
        "region": base["region"].values,
        "timestamp": [t.isoformat(timespec="seconds") for t in timestamps],
        "impact_score": np.round(impact_score, 3),
        "completion_rate": np.round(completion_rate, 3),
        "spending_pattern": spending_pattern,
        "transaction_frequency": transaction_freq,
        "anomaly_flag": anomaly_mask.astype(int),
        "payment_method": rng.choice(PAYMENT_METHODS, size=cfg.rows),
    })
    return df.sort_values("timestamp").reset_index(drop=True)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=10_000)
    parser.add_argument("--users", type=int, default=600)
    parser.add_argument("--seed", type=int, default=7)
    parser.add_argument("--anomaly-rate", type=float, default=0.03)
    parser.add_argument("--out", type=str, default="data/synthetic_transactions.csv")
    args = parser.parse_args()

    cfg = GenConfig(
        rows=args.rows, n_users=args.users, seed=args.seed,
        out_path=args.out, anomaly_rate=args.anomaly_rate,
    )

    df = generate(cfg)
    os.makedirs(os.path.dirname(cfg.out_path) or ".", exist_ok=True)
    df.to_csv(cfg.out_path, index=False)
    print(f"Wrote {len(df):,} rows -> {cfg.out_path}")
    print(df.head(5).to_string(index=False))
    print(f"Anomaly rate (actual): {df['anomaly_flag'].mean():.3%}")


if __name__ == "__main__":
    main()
