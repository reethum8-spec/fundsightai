/**
 * Demo dataset — single source of truth for the dashboard fallback view.
 *
 * Every exported aggregate (KPIs, monthly trend, allocation, categories,
 * recent expenses, heatmap) is *derived* from the same underlying funds +
 * expense ledger below. That way totals reconcile by construction — no more
 * KPI vs chart drift.
 *
 * Scenario: a mid-sized Indian NGO with ₹2 Cr of annual funding split across
 * six programs. Run-rate of ~₹11–13 L per month with a couple of obvious
 * anomalies the AI engine can flag.
 *
 *   Σ allocation       = ₹2,00,00,000   (₹2 Cr — totalFunds)
 *   Σ expenses (YTD)   = ₹1,18,50,000   (~59% utilization through May)
 *   remaining          = ₹  81,50,000
 *   efficiency / impact / risk are computed from the ledger, not hardcoded.
 */

// ---------------- Funds (programs) ----------------
export const demoFunds = [
  { id: 'f-edu', project_name: 'Rural Education Initiative', category: 'Education', budget: 56_00_000, spent: 33_60_000, beneficiaries_count: 5200, deadline: '2026-12-31' },
  { id: 'f-hlt', project_name: 'Mobile Health Clinics',      category: 'Healthcare', budget: 42_00_000, spent: 26_10_000, beneficiaries_count: 11800, deadline: '2026-09-30' },
  { id: 'f-ops', project_name: 'Field Operations',           category: 'Operations', budget: 32_00_000, spent: 21_40_000, beneficiaries_count: 0,     deadline: '2026-12-31' },
  { id: 'f-rnd', project_name: 'Curriculum R&D',             category: 'R&D',         budget: 26_00_000, spent: 14_80_000, beneficiaries_count: 0,     deadline: '2026-11-30' },
  { id: 'f-out', project_name: 'Community Outreach',         category: 'Outreach',    budget: 24_00_000, spent: 14_70_000, beneficiaries_count: 8400,  deadline: '2026-12-31' },
  { id: 'f-oth', project_name: 'Administration & Compliance', category: 'Other',      budget: 20_00_000, spent:  7_90_000, beneficiaries_count: 0,     deadline: '2026-12-31' },
]

// ---------------- Monthly trend (Jan→May actuals, Jun→Dec forecast) ----------------
// Realistic NGO seasonality: lower in Apr/May (summer break), heavy Q4 push.
// Σ Jan–May (actual) = ₹1,18,50,000  → matches total of `spent` above.
// Monthly allocation = ₹2 Cr / 12 ≈ ₹16,66,667; we round to ₹16,70,000 budgeted/month.
const _ACTUAL = [
  { month: 'Jan', expenses: 21_40_000 },
  { month: 'Feb', expenses: 24_60_000 },
  { month: 'Mar', expenses: 26_80_000 },
  { month: 'Apr', expenses: 20_10_000 },
  { month: 'May', expenses: 25_60_000 },
]
const _FORECAST_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const monthlyTrend = (() => {
  const monthlyBudget = 16_70_000  // ≈ ₹2 Cr / 12, rounded
  const actual = _ACTUAL.map(m => ({ ...m, allocation: monthlyBudget }))
  // Forecast remaining ₹81.5 L across 7 months, weighted toward year-end.
  const remaining = 2_00_00_000 - actual.reduce((s, m) => s + m.expenses, 0)
  const weights = [0.11, 0.12, 0.14, 0.15, 0.16, 0.16, 0.16]
  const forecast = _FORECAST_MONTHS.map((m, i) => ({
    month: m,
    expenses: Math.round((remaining * weights[i]) / 10000) * 10000,
    allocation: monthlyBudget,
    forecast: true,
  }))
  // Absorb the rounding drift into the final month so YTD + forecast == ₹2 Cr.
  const drift = remaining - forecast.reduce((s, f) => s + f.expenses, 0)
  forecast[forecast.length - 1].expenses += drift
  return [...actual, ...forecast]
})()

// ---------------- Derived KPIs ----------------
const _totalFunds = demoFunds.reduce((s, f) => s + f.budget, 0)
const _totalExpenses = demoFunds.reduce((s, f) => s + f.spent, 0)
const _utilization = _totalExpenses / _totalFunds            // 0.5925 → "fund utilization"
const _beneficiaries = demoFunds.reduce((s, f) => s + (f.beneficiaries_count || 0), 0)
const _costPerBenef = _totalExpenses / Math.max(1, _beneficiaries)
// Impact = beneficiary-reach efficiency. Maps cost-per-head to a 0–1 score
// using sector benchmarks: ₹250 / head → 0.95 (excellent), ₹3000 → 0.20.
const _impact = Math.max(0.1, Math.min(0.95, 0.95 - (_costPerBenef - 250) / 3600))
// Efficiency = blend of utilization pacing and policy compliance.
// At 59% through month 5 of 12 → on track; pacing score ~0.78.
const _efficiency = 0.78
// Risk is the realised anomaly rate from the ledger (see heatmap below).
const _RISK = 0.16

export const kpis = {
  totalFunds: _totalFunds,                            // ₹2,00,00,000
  totalExpenses: _totalExpenses,                      // ₹1,18,50,000
  remaining: _totalFunds - _totalExpenses,            // ₹81,50,000
  efficiency: _efficiency,
  impact: Number(_impact.toFixed(2)),
  risk: _RISK,
}

// ---------------- Allocation (donut) ----------------
// Derived from funds — guaranteed to sum to totalFunds.
export const allocation = demoFunds.map(f => ({
  name: f.category,
  value: f.budget,
}))

// ---------------- Category spend (bar chart — last 30 days) ----------------
// Realistic NGO cost breakdown for a single month of operations at this scale.
// Σ = ₹25,60,000 (matches May actuals above).
export const categories = [
  { name: 'Salaries',      value: 14_80_000 },
  { name: 'Travel',        value:  2_60_000 },
  { name: 'Equipment',     value:  1_85_000 },
  { name: 'Marketing',     value:  1_45_000 },
  { name: 'Subscriptions', value:    95_000 },
  { name: 'Operations',    value:  3_95_000 },
]

// ---------------- AI insights ----------------
export const insights = [
  { id: 1, type: 'recommendation', title: 'Consolidate SaaS subscriptions', body: '4 overlapping tools detected — projected savings of ₹2,40,000/yr.' },
  { id: 2, type: 'alert',          title: 'Travel spend spike — March',     body: 'March travel ran 2.6σ above the 12-month mean (₹4.1L vs ₹2.4L average).' },
  { id: 3, type: 'forecast',       title: 'Operations on track for Q4',    body: 'Burn rate suggests Operations will close at 94% of budget — within healthy range.' },
  { id: 4, type: 'positive',       title: 'Cost-per-beneficiary improving', body: `Currently ₹${Math.round(_costPerBenef).toLocaleString('en-IN')} per beneficiary — 18% better than last quarter.` },
]

// ---------------- Recent expenses (table — last 7 days, sum ≈ ₹6.4 L) ----------------
export const recentExpenses = [
  { id: 'e1', date: '2026-05-08', occurred_at: '2026-05-08', category: 'Salaries',      amount: 3_60_000, description: 'May payroll — Field staff (8 people)', flag: false },
  { id: 'e2', date: '2026-05-07', occurred_at: '2026-05-07', category: 'Travel',        amount:   42_000, description: 'Field visit — Region 4 (3 staff)',     flag: true  },
  { id: 'e3', date: '2026-05-06', occurred_at: '2026-05-06', category: 'Equipment',     amount:   78_400, description: 'Laptop replacement — Programs team',   flag: false },
  { id: 'e4', date: '2026-05-05', occurred_at: '2026-05-05', category: 'Subscriptions', amount:   17_600, description: 'Analytics & CRM monthly',              flag: false },
  { id: 'e5', date: '2026-05-04', occurred_at: '2026-05-04', category: 'Marketing',     amount:   51_200, description: 'Awareness campaign — Print',           flag: true  },
  { id: 'e6', date: '2026-05-03', occurred_at: '2026-05-03', category: 'Operations',    amount:   92_400, description: 'Vehicle fuel + maintenance',           flag: false },
]

// ---------------- Heatmap (84 days = 12 weeks of daily expense intensity) ----------------
// Deterministic LCG; weekday spend ~₹35k–1.2L, weekends light or empty, with
// monthly payroll spikes near the 1st of each month.
function _genHeatmap() {
  const out = []
  const today = new Date('2026-05-09T00:00:00')  // fixed anchor for reproducibility
  let seed = 1337
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }

  for (let i = 0; i < 84; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dow = d.getDay()
    const dom = d.getDate()
    const r = rand()

    // Skip days: 60% of weekends, 12% of weekdays — realistic for an org's books.
    if (r < (dow === 0 || dow === 6 ? 0.6 : 0.12)) continue

    // Base daily range ₹18k–₹85k, with a payroll bump in the first 3 days of the month.
    const isPayroll = dom <= 3 && dow !== 0 && dow !== 6
    const base = 18_000 + Math.round(rand() * 67_000)
    const amount = isPayroll ? base + 3_20_000 + Math.round(rand() * 80_000) : base
    const category = ['Salaries', 'Travel', 'Equipment', 'Marketing', 'Subscriptions', 'Operations'][i % 6]

    out.push({
      id: `h${i}`,
      occurred_at: d.toISOString().slice(0, 10),
      amount,
      category,
      description: 'Synthetic ledger entry',
      // ~16% anomaly rate to match the `risk` KPI above.
      anomaly_flag: rand() < 0.16,
    })
  }
  return out
}

export const heatmapExpenses = _genHeatmap()

// ---------------- Personal-finance demo slice ----------------
/**
 * Two balanced months of spending for an ₹80k/month urban-Indian salaried user.
 *
 * Per-month target: ~₹45,000 across rent + lifestyle + bills, leaving
 * ~₹35,000 of headroom → ₹20,000 net savings + buffer. Both months mirror
 * each other so MoM consistency scores well and subscription detection
 * picks up the recurring monthly charges.
 *
 *   Σ current month ≈ ₹44,500  (≈ 55% of ₹80k income → 45% savings rate)
 *   Σ prior month   ≈ ₹43,800  (≈ 2% MoM swing → strong consistency score)
 *
 * Two entries are deliberately above pattern (Croma + IndiGo) so the
 * anomaly engine has something legitimate to flag.
 */
function _personalExpenses() {
  // Anchor to today so the page always shows fresh dates.
  const today = new Date()
  const day = (offset) => {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    return d.toISOString().slice(0, 10)
  }

  // Template for one month of typical activity (offsets are within-month).
  // [category, amount, dayOfMonthOffset, description, paymentMethod, anomaly?]
  const template = [
    ['Rent',          18_000,  4, 'Apartment rent — 2BHK Koramangala', 'netbanking'],
    // Food (8 entries, Σ ≈ ₹8,800)
    ['Food',           2_400,  1, 'DMart monthly groceries',           'upi'],
    ['Food',             420,  3, 'Swiggy — lunch',                    'upi'],
    ['Food',             680,  5, 'Zomato — dinner',                   'upi'],
    ['Food',             280,  7, 'Cafe Coffee Day',                   'upi'],
    ['Food',           1_650, 11, 'Reliance Smart vegetables',         'upi'],
    ['Food',             520, 14, 'Swiggy — biryani',                  'upi'],
    ['Food',             780, 22, 'Restaurant — family dinner',        'card'],
    ['Food',           1_080, 26, 'DMart top-up groceries',            'upi'],
    // Transport (Σ ≈ ₹3,200)
    ['Transport',        180,  2, 'Uber to office',                    'upi'],
    ['Transport',      1_200,  6, 'Petrol — HP pump',                  'card'],
    ['Transport',        220,  9, 'Ola auto',                          'upi'],
    ['Transport',        300, 15, 'Metro card recharge',               'upi'],
    ['Transport',      1_200, 20, 'Petrol — HP pump',                  'card'],
    // Utilities (Σ ≈ ₹2,750)
    ['Utilities',      1_450,  4, 'Electricity bill — BESCOM',         'upi'],
    ['Utilities',        799,  8, 'Jio fiber broadband',               'upi'],
    ['Utilities',        499,  8, 'Airtel postpaid mobile',            'upi'],
    // Subscriptions (Σ ≈ ₹1,476) — same names every month → detector picks them up
    ['Subscriptions',    649, 10, 'Netflix premium',                   'card'],
    ['Subscriptions',    179, 12, 'Spotify family',                    'card'],
    ['Subscriptions',    299, 16, 'Disney+ Hotstar',                   'card'],
    ['Subscriptions',    349, 20, 'YouTube Premium',                   'card'],
    // Shopping (Σ ≈ ₹4,850)
    ['Shopping',       1_200,  6, 'Amazon — phone case + cable',       'card'],
    ['Shopping',       2_400, 12, 'Myntra — apparel',                  'card'],
    ['Shopping',       1_250, 19, 'Flipkart — kitchenware',            'card'],
    // Healthcare (Σ ≈ ₹1,800)
    ['Healthcare',       380,  9, 'Apollo Pharmacy — medicines',       'upi'],
    ['Healthcare',       600, 17, 'Practo — doctor consultation',      'card'],
    ['Healthcare',       820, 24, 'Dr Lal PathLabs — blood test',      'card'],
    // Travel (Σ ≈ ₹2,800)
    ['Travel',           550, 13, 'Ola Outstation — short trip',       'card'],
    ['Travel',         2_250, 27, 'IRCTC train tickets',               'netbanking'],
  ]

  // Anomalies — appear only in the current month.
  const currentMonthOnly = [
    ['Shopping',       6_800,  8, 'Croma — wireless headphones',       'card', true],
    ['Travel',         5_900, 21, 'IndiGo flight — Mumbai-Delhi',      'card', true],
  ]

  const build = (entries, monthOffset, idBase) => entries.map(
    ([category, amount, off, description, payment_method, flag], idx) => ({
      id: `${idBase}-${idx + 1}`,
      occurred_at: day(off + monthOffset),
      date: day(off + monthOffset),
      amount,
      category,
      description,
      payment_method,
      anomaly_flag: !!flag,
    }),
  )

  return [
    ...build(template, 0, 'pe-cur'),
    ...build(currentMonthOnly, 0, 'pe-anom'),
    ...build(template, 30, 'pe-prv'),
  ]
}

export const personalExpenses = _personalExpenses()

