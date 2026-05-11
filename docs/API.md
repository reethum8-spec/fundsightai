# API Reference

Base URL (local): `http://localhost:5000/api`

## Auth

All write endpoints require a Supabase access token:

```
Authorization: Bearer <access_token>
```

Get the token in the browser via:

```js
const { data } = await supabase.auth.getSession()
data.session.access_token
```

In **mock mode** (`USE_MOCK=true`), auth is bypassed and a synthetic
`org_admin` user is injected.

Errors use the shape: `{ "error": "<code>", ...details }`. Validation
failures return `422` with `{ error: "validation_failed", fields: { ... } }`.

---

## Health
- `GET /health` → `{ status, env, mock, service, version }`

## Me
- `GET /me` → current user (auth required)
- `GET /me/admin` → 200 if role ∈ {org_admin, super_admin}, else 403

## Funds (`projects` table)
| Method | Path | Auth | Body |
|--|--|--|--|
| GET    | `/funds`           | optional | — |
| GET    | `/funds/:id`       | optional | — |
| POST   | `/funds`           | required | `{ project_name, category, budget, expected_impact?, beneficiaries_count?, deadline? }` |
| PUT    | `/funds/:id`       | required | partial of POST body |
| DELETE | `/funds/:id`       | admin    | — |

## Expenses
| Method | Path | Auth | Body |
|--|--|--|--|
| GET    | `/expenses?category=&from=&to=` | optional | — |
| GET    | `/expenses/:id`    | optional | — |
| POST   | `/expenses`        | required | `{ amount, category, occurred_at?, description?, payment_method?, location?, beneficiary?, project_id?, receipt_url? }` |
| PUT    | `/expenses/:id`    | required | partial of POST body |
| DELETE | `/expenses/:id`    | admin    | — |
| POST   | `/expenses/import` | required | `multipart/form-data` with `file=<csv>` OR raw CSV body |

CSV columns must match the POST body keys. Returns:
```json
{ "inserted": 12, "errors": [{ "row": 5, "fields": {"amount": "required"} }], "total": 13 }
```

## AI
- `GET  /ai/insights` — recommendations (mock list in Phase 1, model-driven from Phase 6)
- `POST /ai/anomalies` — body: `{ expenses: [...] }` → `{ flagged: [...], mean, stdev }`
- `POST /ai/predict-overrun` — body: `{ fund_id }` → `{ utilization, projected_utilization, overrun_probability, recommended_action }`

---

## Validation rules (current)

**Fund**:
- `project_name`: required, ≤ 200 chars
- `category`: one of Education, Healthcare, Operations, R&D, Outreach, Other, Marketing, Travel, Equipment, Salaries, Subscriptions
- `budget`: number ≥ 0
- `beneficiaries_count`: integer ≥ 0
- `deadline`: ISO date `YYYY-MM-DD`

**Expense**:
- `amount`: number ≥ 0 (required)
- `category`: from the fund categories + Donations, Emergency, Groceries, Transport, Utilities
- `payment_method`: one of card, bank_transfer, cash, wallet, check, other
- `occurred_at`: ISO date (defaults to today)
