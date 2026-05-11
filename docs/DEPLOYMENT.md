# Deployment Guide

## Frontend → Vercel

1. Push repo to GitHub.
2. On Vercel: **New Project** → import the repo → set **Root Directory** to `frontend`.
3. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
4. Add env vars:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (your Render backend URL)
   - `VITE_USE_MOCK=false`
5. Deploy.

## Backend → Render

1. **New Web Service** → connect repo → **Root Directory** `backend`.
2. Runtime: Python 3.11. Build: `pip install -r requirements.txt`. Start: `gunicorn app:app`.
3. Env vars:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FLASK_ENV=production`
   - `USE_MOCK=false`
   - `JWT_SECRET=<random-32-bytes>`
4. Deploy and copy the URL into the frontend `VITE_API_BASE_URL`.

## Database → Supabase

1. Create a project at https://supabase.com.
2. SQL editor → run `database/schema.sql`.
3. Auth → enable **Email** + **Google** providers.
4. Copy the project URL + anon key + service role key into the env files above.

## Post-Deploy Validation

## AI Models (Production)

Models are **not** shipped in the repo. After deployment:

```bash
# SSH into the backend server / container
cd ai_models
python dataset_generator.py --rows 20000
python train_model.py
# Artifacts are written to ai_models/models/*.joblib
# Restart the backend process so it picks them up.
```

For zero-downtime retraining, mount `ai_models/models/` as a persistent volume
and restart Gunicorn workers (`kill -HUP` or rolling restart).

## Security Checklist (Production)

- [ ] `JWT_SECRET` is a strong random string (≥32 bytes), not the default
- [ ] `SUPABASE_JWT_SECRET` is set (prevents unverified JWT fallback)
- [ ] `USE_MOCK=false` in production
- [ ] `FLASK_ENV=production` (enables HSTS header + disables debug)
- [ ] CORS_ORIGINS is restricted to your exact frontend domain(s)
- [ ] Supabase RLS policies are enabled (see `database/schema.sql`)
- [ ] Supabase Auth → Email confirmation required
- [ ] Supabase Auth → Google OAuth redirect URL matches deployed frontend
- [ ] Backend is behind HTTPS (required for HSTS)
- [ ] Rate limiting is active (default 30 req/min per IP; PDF gen limited to 5/min)
- [ ] Admin endpoints restricted to `org_admin` / `super_admin` roles
- [ ] `.env` files are **not** committed (they are gitignored)

## Performance Tuning

| Layer | Tactic |
|-------|--------|
| Frontend | Lazy-loaded routes (`Funds`, `Expenses`, `PersonalFinance`, `Reports`, `Admin`) |
| Frontend | Vite build produces hashed assets with aggressive caching headers |
| Backend | Gunicorn workers = `2-4 × CPU cores` |
| Backend | PDF cache is in-memory; for multi-instance deploy use Redis or Supabase Storage |
| Backend | AI model loading is lazy (first request triggers import; keeps startup fast) |
| Database | Supabase indexes on `expenses(project_id, occurred_at)` and `profiles(role)` |

## Post-Deploy Validation

- [ ] `/` loads landing page
- [ ] Signup → email confirm → login works
- [ ] Google OAuth round-trip works
- [ ] Backend `/api/health` returns 200
- [ ] Dashboard renders with real data
- [ ] No CORS errors in console
- [ ] Admin panel accessible only with `org_admin` role
- [ ] Report PDF downloads successfully
- [ ] `/api/ai/status` shows `available: true` after model training
