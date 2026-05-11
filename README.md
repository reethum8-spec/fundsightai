# FundSight AI

> AI-Powered Fund Utilization & Financial Intelligence Platform

A premium full-stack SaaS platform that tracks, analyzes, predicts, and visualizes
financial fund utilization for **NGOs, institutions, businesses, startups, and personal
finance users** — combining fund management, expense tracking, AI anomaly detection,
predictive analytics, and impact analysis.

---

## Monorepo Structure

```
FundSightAI/
├── frontend/      # React + Vite + Tailwind + shadcn/ui + Framer Motion + Recharts
├── backend/       # Flask (Python) REST API
├── ai_models/     # Pandas / NumPy / scikit-learn pipelines
├── database/      # Supabase Postgres schema & migrations
└── docs/          # API, deployment, architecture
```

---

## Quick Start (Mock Mode)

You can run the app end-to-end without Supabase keys. Auth and data are mocked
in-memory — perfect for local UI development.

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at http://localhost:5173

### 2. Backend (optional in mock mode)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate         # Windows
pip install -r requirements.txt
python app.py
```

API runs at http://localhost:5000

### 3. AI Models — generate synthetic dataset

```bash
cd ai_models
pip install -r requirements.txt
python dataset_generator.py
```

Produces `ai_models/data/synthetic_transactions.csv` (~10k rows).

---

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Scaffolded (mock) | Project setup, landing page, dashboard skeleton |
| 2 | ✅ Implemented | Supabase Auth (email, Google OAuth, RBAC) — see `docs/SUPABASE_SETUP.md` |
| 3 | ✅ Implemented | Hybrid data layer: Supabase reads + Flask validated writes + RBAC + dashboard wired |
| 4 | ✅ Implemented | Dashboard polish: spending heatmap, mobile drawer, skeleton states |
| 5 | ✅ Implemented | Funds + Expenses pages, modals, filters, CSV import |
| 6 | ✅ Implemented | AI: Isolation Forest + Random Forest with rule fallback + dynamic recommendations — see `docs/AI.md` |
| 7 | ✅ Implemented | Personal Finance: Health Score, budgets, savings goals, subscription detection, AI coach |
| 8 | ✅ Implemented | PDF reports with charts, AI summaries, top expenses, downloadable from `/reports` |
| 9 | ✅ Implemented | Admin panel: user management, role assignment, system metrics, flagged activity, audit log |
| 10 | ✅ Implemented | Security headers, rate limiting, lazy loading, env validation, deployment docs + Procfile — see `docs/DEPLOYMENT.md` |

---

## Environment Variables

Copy `.env.example` files in each subfolder and fill in the values when moving
out of mock mode (Phase 2+).

```
# frontend/.env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:5000
VITE_USE_MOCK=true

# backend/.env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FLASK_ENV=development
USE_MOCK=true
```

---

## Patent-Worthy Features (planned)

1. **Dynamic Fund Efficiency Score** — multi-factor real-time efficiency rating
2. **AI Transparency Index** — auditable spending transparency scoring
3. **Impact-to-Spending Ratio** — outcome-weighted spend analysis
4. **Financial Behavior Mapping** — clusters and trajectories of spend behavior
5. **Misuse Probability Prediction** — anomaly + risk hybrid scoring
6. **Hybrid Institutional + Personal Finance Intelligence** — unified model

---

## Deployment

- **Frontend** → Vercel (`frontend/`)
- **Backend** → Render (`backend/`)
- **DB / Auth** → Supabase

See `docs/DEPLOYMENT.md` for full instructions.
