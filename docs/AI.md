# AI / ML

## Overview

FundSight AI ships a hybrid ML + rules pipeline:

| Capability | Engine | Fallback |
|--|--|--|
| Anomaly detection | `IsolationForest` | z-score (σ ≥ 2) |
| Overrun prediction | `RandomForestRegressor` (target = `expense / allocation` ratio) | linear burn-rate |
| Recommendations | rule-based + data-driven (uses live expenses) | demo set |

The backend tries the ML engine first and falls back automatically — so the
dashboard works the moment the backend is up, even before models are trained.

## Folder layout

```
ai_models/
├── dataset_generator.py    # synthetic data (10k rows by default)
├── preprocessing.py        # feature engineering + one-hot encoding
├── train_model.py          # trains both models, writes models/*.joblib + metrics.json
├── inference_api.py        # detect_anomalies, predict_overrun, recommendations_for
├── requirements.txt
├── data/                   # generated CSVs (gitignored)
└── models/                 # trained joblib artifacts (gitignored)
```

## End-to-end setup

```powershell
# 1. Install AI deps (Python 3.12 venv)
cd ai_models
py -3.12 -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt

# 2. Generate synthetic dataset
python dataset_generator.py --rows 10000

# 3. Train models
python train_model.py
# -> writes models/isolation_forest.joblib + models/rf_overrun.joblib + models/metrics.json
```

After training, restart Flask. The dashboard's **AI Insights** card will
flip from `Rule-based` to `ML engine`. Verify:

```bash
curl http://localhost:5000/api/ai/status
```

```json
{ "available": true, "engine_loaded": true, "isolation_forest": true, "rf_overrun": true, ... }
```

## Endpoints

- `GET  /api/ai/status` — model availability + paths
- `GET  /api/ai/insights` — dynamic recommendations from live data
- `POST /api/ai/anomalies` — `{ expenses: [...] }` → `{ flagged, scored, engine }`
- `POST /api/ai/predict-overrun` — `{ fund_id }` → utilization, projection, overrun probability

## Metrics

After `train_model.py`, inspect `ai_models/models/metrics.json` for:
- IsolationForest classification report against the synthetic `anomaly_flag` ground truth
- RandomForest MAE + R² on the overrun target
- Top-10 feature importances

## Retraining

Re-run `train_model.py` against new data (CSV with the same columns produced
by `dataset_generator.py` or live exports from Supabase). Models are stable
to retrain; the backend will pick up new artifacts on the next process start
(or first lazy load).
