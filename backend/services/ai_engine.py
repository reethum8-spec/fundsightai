"""AI engine — bridges Flask backend to `ai_models/` trained artifacts.

Behavior:
  - Tries to import `inference_api` from the sibling `ai_models/` folder.
  - Lazily loads `models/isolation_forest.joblib` and `rf_overrun.joblib`.
  - Exposes `available()`, `detect_anomalies()`, `predict_overrun()`, `recommendations()`.
  - If models or deps are missing, returns `available() == False` and the
    routes fall back to deterministic rule-based stubs.
"""
from __future__ import annotations
import os
import sys
import logging
from functools import lru_cache
from typing import Any

log = logging.getLogger(__name__)

# Locate the ai_models folder relative to the backend root.
_HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # backend/
_AI_MODELS_DIR = os.path.normpath(os.path.join(_HERE, "..", "ai_models"))
if os.path.isdir(_AI_MODELS_DIR) and _AI_MODELS_DIR not in sys.path:
    sys.path.insert(0, _AI_MODELS_DIR)

# Configurable artifact dir (override with FS_MODELS_DIR env var).
MODELS_DIR = os.getenv("FS_MODELS_DIR", os.path.join(_AI_MODELS_DIR, "models"))


def _try_import():
    """Import inference_api on demand — silently disabled if unavailable."""
    try:
        os.environ.setdefault("FS_MODELS_DIR", MODELS_DIR)
        import inference_api  # noqa: F401  (module from ai_models/)
        return inference_api
    except Exception as e:  # noqa: BLE001
        log.info("AI engine disabled: %s", e)
        return None


@lru_cache(maxsize=1)
def _engine():
    return _try_import()


def _models_present() -> bool:
    iso = os.path.join(MODELS_DIR, "isolation_forest.joblib")
    rf = os.path.join(MODELS_DIR, "rf_overrun.joblib")
    return os.path.isfile(iso) and os.path.isfile(rf)


def available() -> bool:
    return _engine() is not None and _models_present()


def status() -> dict[str, Any]:
    return {
        "available": available(),
        "engine_loaded": _engine() is not None,
        "models_dir": MODELS_DIR,
        "isolation_forest": os.path.isfile(os.path.join(MODELS_DIR, "isolation_forest.joblib")),
        "rf_overrun": os.path.isfile(os.path.join(MODELS_DIR, "rf_overrun.joblib")),
    }


# ---------------- Public API used by routes/ai.py ----------------
def detect_anomalies(records: list[dict]) -> list[dict]:
    """Returns each record annotated with `anomaly` and `anomaly_score`."""
    eng = _engine()
    if not eng or not records:
        return []
    return eng.detect_anomalies(records)


def predict_overrun(records: list[dict]) -> list[dict]:
    """Returns each record annotated with `predicted_spend_to_allocation`."""
    eng = _engine()
    if not eng or not records:
        return []
    return eng.predict_overrun(records)


def recommendations_for(record: dict) -> list[str]:
    eng = _engine()
    if not eng:
        return []
    return eng.recommendations_for(record)
