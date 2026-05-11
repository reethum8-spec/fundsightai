"""Preprocessing utilities for FundSight AI models.

Phase 6 will train models against features produced here.
"""
from __future__ import annotations
import pandas as pd
import numpy as np


NUMERIC_FEATURES = ["income", "allocated_funds", "expense_amount",
                    "completion_rate", "transaction_frequency"]

CATEGORICAL_FEATURES = ["user_type", "expense_category", "project_type",
                        "region", "spending_pattern", "payment_method"]


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    return df


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["spend_to_income_ratio"] = df["expense_amount"] / df["income"].replace(0, np.nan)
    df["spend_to_allocation_ratio"] = df["expense_amount"] / df["allocated_funds"].replace(0, np.nan)
    df["log_amount"] = np.log1p(df["expense_amount"])
    df["month"] = df["timestamp"].dt.month
    df["dow"] = df["timestamp"].dt.dayofweek
    return df.fillna({"spend_to_income_ratio": 0, "spend_to_allocation_ratio": 0})


def encode_features(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """One-hot encode categoricals; return X and used feature names."""
    df = add_engineered_features(df)
    encoded = pd.get_dummies(df[CATEGORICAL_FEATURES], drop_first=True)
    numeric = df[NUMERIC_FEATURES + ["spend_to_income_ratio", "spend_to_allocation_ratio",
                                     "log_amount", "month", "dow"]].astype(float)
    X = pd.concat([numeric.reset_index(drop=True), encoded.reset_index(drop=True)], axis=1)
    return X, X.columns.tolist()
