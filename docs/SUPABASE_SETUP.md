# Supabase Setup (Phase 2)

Follow these steps once to switch FundSight AI from mock mode to real auth.

## 1. Create the project

1. Go to https://supabase.com → **New project**
2. Pick a region close to you, generate a strong database password
3. Wait ~2 minutes for it to provision

## 2. Run the schema

1. In the Supabase dashboard → **SQL Editor** → **New query**
2. Paste the entire contents of `database/schema.sql`
3. Click **Run**. You should see "Success. No rows returned."

This creates: `organizations`, `profiles`, `projects`, `budgets`, `expenses`,
`ai_predictions`, `alerts`, `reports`, `uploaded_files`, plus the
`on_auth_user_created` trigger that auto-creates a profile on every signup.

## 3. Enable Email auth

1. **Authentication** → **Providers** → **Email**
2. Toggle **Enable Email provider** → **Save**
3. (Recommended for dev) Under **Auth** → **URL Configuration**, set:
   - **Site URL** = `http://localhost:5173`
   - **Redirect URLs** add `http://localhost:5173/auth/callback`
4. (Optional for fastest dev) Under **Email** → disable **Confirm email** to skip the inbox click step.

## 4. Enable Google OAuth

1. Create OAuth credentials in Google Cloud Console
   - https://console.cloud.google.com/apis/credentials → **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
2. Copy the **Client ID** and **Client Secret**
3. In Supabase → **Authentication** → **Providers** → **Google** → enable, paste the values, save.

## 5. Get your keys

In Supabase → **Project Settings** → **API**:

- **Project URL** → `VITE_SUPABASE_URL` and `SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`
- **service_role** key (keep secret!) → `SUPABASE_SERVICE_ROLE_KEY`
- **JWT Settings** → **JWT Secret** → `SUPABASE_JWT_SECRET`

## 6. Configure local env

Create `frontend/.env`:

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_API_BASE_URL=http://localhost:5000
VITE_USE_MOCK=false
```

Create `backend/.env`:

```
FLASK_ENV=development
PORT=5000
USE_MOCK=false
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_JWT_SECRET=<from step 5>
JWT_SECRET=any-random-string
CORS_ORIGINS=http://localhost:5173
```

## 7. Restart the dev servers

```powershell
# frontend
npm run dev

# backend
python app.py
```

The sidebar in `/dashboard` should now say **Live mode**.

## 8. Verify

- [ ] Sign up via email → receive confirmation email (or skip if disabled) → redirected to dashboard
- [ ] Sign in with Google → returns to `/auth/callback` → lands on dashboard
- [ ] `/api/me` returns your user info when called with `Authorization: Bearer <access_token>`
- [ ] `/api/me/admin` returns 403 unless your role is `org_admin` or `super_admin`

## Troubleshooting

| Symptom | Fix |
|--|--|
| "Email not confirmed" on login | Open the link in the confirmation email, or disable email confirmation in Supabase settings |
| Stuck on `/auth/callback` | Make sure `http://localhost:5173/auth/callback` is in **Redirect URLs** |
| Sidebar still says "Mock mode" | `VITE_USE_MOCK` must be `false` AND both Supabase env vars must be present; restart Vite |
| Backend returns 401 even with token | Confirm `SUPABASE_JWT_SECRET` is set; restart Flask |
