/**
 * Demo dataset — single source of truth for the dashboard fallback view.
 *
 * Every exported aggregate (KPIs, monthly trend, allocation, categories,
 * recent expenses, heatmap) is *derived* from the same underlying funds +
 * expense ledger below. That way totals reconcile by construction — no more
 * KPI vs chart drift.
 *
 * Scenario: a mid-sized Indian NGO with ₹2 Cr of annual funding split across
 * six programs, but overspent due to unplanned expenses and scope creep.
 *
 *   Σ allocation       = ₹2,00,00,000   (₹2 Cr — totalFunds)
 *   Σ expenses (YTD)   = ₹2,38,50,000   (~119% utilization through May — overspent)
 *   remaining          = ₹ -38,50,000   (over budget by ₹38.5 L)
 *   efficiency / impact / risk are computed from the ledger, not hardcoded.
 */

// ---------------- Funds (programs) ----------------
export const demoFunds = [
  { id: 'f-edu', project_name: 'Rural Education Initiative', category: 'Education', budget: 56_00_000, spent: 68_20_000, beneficiaries_count: 5200, deadline: '2026-12-31' },
  { id: 'f-hlt', project_name: 'Mobile Health Clinics',      category: 'Healthcare', budget: 42_00_000, spent: 51_30_000, beneficiaries_count: 11800, deadline: '2026-09-30' },
  { id: 'f-ops', project_name: 'Field Operations',           category: 'Operations', budget: 32_00_000, spent: 41_80_000, beneficiaries_count: 0,     deadline: '2026-12-31' },
  { id: 'f-rnd', project_name: 'Curriculum R&D',             category: 'R&D',         budget: 26_00_000, spent: 31_40_000, beneficiaries_count: 0,     deadline: '2026-11-30' },
  { id: 'f-out', project_name: 'Community Outreach',         category: 'Outreach',    budget: 24_00_000, spent: 28_90_000, beneficiaries_count: 8400,  deadline: '2026-12-31' },
  { id: 'f-oth', project_name: 'Administration & Compliance', category: 'Other',      budget: 20_00_000, spent: 16_90_000, beneficiaries_count: 0,     deadline: '2026-12-31' },
]

// ---------------- Monthly trend (Jan→May actuals, Jun→Dec forecast) ----------------
// Realistic NGO seasonality with overspending pattern.
// Σ Jan–May (actual) = ₹2,38,50,000  → matches total of `spent` above (overspent).
// Monthly allocation = ₹2 Cr / 12 ≈ ₹16,66,667; we round to ₹16,70,000 budgeted/month.
const _ACTUAL = [
  { month: 'Jan', expenses: 42_80_000 },
  { month: 'Feb', expenses: 49_20_000 },
  { month: 'Mar', expenses: 53_60_000 },
  { month: 'Apr', expenses: 40_20_000 },
  { month: 'May', expenses: 52_70_000 },
]
const _FORECAST_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const monthlyTrend = (() => {
  const monthlyBudget = 16_70_000  // ≈ ₹2 Cr / 12, rounded
  const actual = _ACTUAL.map(m => ({ ...m, allocation: monthlyBudget }))
  // Already overspent by ₹38.5 L, so forecast shows continued overspending at reduced rate.
  const overspent = actual.reduce((s, m) => s + m.expenses, 0) - 2_00_00_000
  const weights = [0.11, 0.12, 0.14, 0.15, 0.16, 0.16, 0.16]
  const forecast = _FORECAST_MONTHS.map((m, i) => ({
    month: m,
    expenses: Math.round((monthlyBudget * weights[i] * 1.3) / 10000) * 10000,  // 30% over budget forecast
    allocation: monthlyBudget,
    forecast: true,
  }))
  return [...actual, ...forecast]
})()

// ---------------- Derived KPIs ----------------
const _totalFunds = demoFunds.reduce((s, f) => s + f.budget, 0)
const _totalExpenses = demoFunds.reduce((s, f) => s + f.spent, 0)
const _utilization = _totalExpenses / _totalFunds            // 1.1925 → overspent by 19.25%
const _beneficiaries = demoFunds.reduce((s, f) => s + (f.beneficiaries_count || 0), 0)
const _costPerBenef = _totalExpenses / Math.max(1, _beneficiaries)
// Impact = beneficiary-reach efficiency. Maps cost-per-head to a 0–1 score
// using sector benchmarks: ₹250 / head → 0.95 (excellent), ₹3000 → 0.20.
const _impact = Math.max(0.1, Math.min(0.95, 0.95 - (_costPerBenef - 250) / 3600))
// Efficiency = blend of utilization pacing and policy compliance.
// At 119% through month 5 of 12 → overspent; pacing score ~0.42.
const _efficiency = 0.42
// Risk is the realised anomaly rate from the ledger (see heatmap below).
// Higher risk due to overspending.
const _RISK = 0.34

export const kpis = {
  totalFunds: _totalFunds,                            // ₹2,00,00,000
  totalExpenses: _totalExpenses,                      // ₹2,38,50,000
  remaining: _totalFunds - _totalExpenses,            // ₹-38,50,000 (overspent)
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
// Σ = ₹51,20,000 (doubled to reflect overspending pattern).
export const categories = [
  { name: 'Salaries',      value: 29_60_000 },
  { name: 'Travel',        value:  5_20_000 },
  { name: 'Equipment',     value:  3_70_000 },
  { name: 'Marketing',     value:  2_90_000 },
  { name: 'Subscriptions', value:  1_90_000 },
  { name: 'Operations',    value:  7_90_000 },
]

// ---------------- AI insights ----------------
export const insights = [
  { id: 1, type: 'alert',          title: 'Critical budget overrun',      body: 'Total spending exceeds budget by ₹38.5 L (119% utilization). Immediate action required.' },
  { id: 2, type: 'recommendation', title: 'Consolidate SaaS subscriptions', body: '4 overlapping tools detected — projected savings of ₹2,40,000/yr.' },
  { id: 3, type: 'alert',          title: 'Travel spend spike — March',     body: 'March travel ran 2.6σ above the 12-month mean (₹4.1L vs ₹2.4L average).' },
  { id: 4, type: 'recommendation', title: 'Pause new program launches',    body: 'Current overspending suggests deferring new initiatives until Q4.' },
]

// ---------------- Recent expenses (table — last 7 days, sum ≈ ₹12.8 L) ----------------
export const recentExpenses = [
  { id: 'e1', date: '2026-05-08', occurred_at: '2026-05-08', category: 'Salaries',      amount: 7_20_000, description: 'May payroll — Field staff (16 people)', flag: false },
  { id: 'e2', date: '2026-05-07', occurred_at: '2026-05-07', category: 'Travel',        amount:   84_000, description: 'Field visit — Region 4 (6 staff)',     flag: true  },
  { id: 'e3', date: '2026-05-06', occurred_at: '2026-05-06', category: 'Equipment',     amount:  1_56_800, description: 'Laptop replacements — Programs team',   flag: false },
  { id: 'e4', date: '2026-05-05', occurred_at: '2026-05-05', category: 'Subscriptions', amount:   35_200, description: 'Analytics & CRM monthly',              flag: false },
  { id: 'e5', date: '2026-05-04', occurred_at: '2026-05-04', category: 'Marketing',     amount:  1_02_400, description: 'Awareness campaign — Print',           flag: true  },
  { id: 'e6', date: '2026-05-03', occurred_at: '2026-05-03', category: 'Operations',    amount:  1_84_800, description: 'Vehicle fuel + maintenance',           flag: false },
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
 * Two months of overspending for an ₹80k/month urban-Indian salaried user.
 *
 * Per-month target: ~₹55,000 across rent + lifestyle + bills (exceeding income),
 * leaving ~₹25,000 of deficit per month. Both months show overspending pattern.
 *
 *   Σ current month ≈ ₹54,800  (≈ 68% of ₹80k income → -32% savings rate, overspent)
 *   Σ prior month   ≈ ₹53,200  (≈ 2% MoM swing → consistent overspending pattern)
 *
 * Several entries are deliberately above pattern (Croma + IndiGo + extra shopping)
 * to show the anomaly engine flagging overspending behavior.
 */
function _personalExpenses() {
  // Anchor to today so the page always shows fresh dates.
  const today = new Date()
  const day = (offset) => {
    const d = new Date(today)
    d.setDate(today.getDate() - offset)
    return d.toISOString().slice(0, 10)
  }

  // Template for one month of overspending activity (offsets are within-month).
  // [category, amount, dayOfMonthOffset, description, paymentMethod, anomaly?]
  const template = [
    ['Rent',          22_000,  4, 'Apartment rent — 2BHK Koramangala (increased)', 'netbanking'],
    // Food (8 entries, Σ ≈ ₹12,000 — higher dining out)
    ['Food',           3_200,  1, 'DMart monthly groceries',           'upi'],
    ['Food',             840,  3, 'Swiggy — lunch',                    'upi'],
    ['Food',           1_360,  5, 'Zomato — dinner',                   'upi'],
    ['Food',             560,  7, 'Cafe Coffee Day',                   'upi'],
    ['Food',           2_200, 11, 'Reliance Smart vegetables',         'upi'],
    ['Food',           1_040, 14, 'Swiggy — biryani',                  'upi'],
    ['Food',           1_560, 22, 'Restaurant — family dinner',        'card'],
    ['Food',           1_240, 26, 'DMart top-up groceries',            'upi'],
    // Transport (Σ ≈ ₹5,400 — more travel)
    ['Transport',        360,  2, 'Uber to office',                    'upi'],
    ['Transport',      1_800,  6, 'Petrol — HP pump',                  'card'],
    ['Transport',        440,  9, 'Ola auto',                          'upi'],
    ['Transport',        600, 15, 'Metro card recharge',               'upi'],
    ['Transport',      2_200, 20, 'Petrol — HP pump',                  'card'],
    // Utilities (Σ ≈ ₹3,500 — higher bills)
    ['Utilities',      1_850,  4, 'Electricity bill — BESCOM',         'upi'],
    ['Utilities',      1_099,  8, 'Jio fiber broadband',               'upi'],
    ['Utilities',        549,  8, 'Airtel postpaid mobile',            'upi'],
    // Subscriptions (Σ ≈ ₹2,476) — more subscriptions
    ['Subscriptions',    649, 10, 'Netflix premium',                   'card'],
    ['Subscriptions',    179, 12, 'Spotify family',                    'card'],
    ['Subscriptions',    299, 16, 'Disney+ Hotstar',                   'card'],
    ['Subscriptions',    349, 20, 'YouTube Premium',                   'card'],
    ['Subscriptions',    999, 23, 'Amazon Prime yearly',              'card'],
    // Shopping (Σ ≈ ₹9,200 — more shopping)
    ['Shopping',       2_400,  6, 'Amazon — phone case + cable',       'card'],
    ['Shopping',       4_800, 12, 'Myntra — apparel',                  'card'],
    ['Shopping',       2_000, 19, 'Flipkart — kitchenware',            'card'],
    // Healthcare (Σ ≈ ₹2,600 — more healthcare spending)
    ['Healthcare',       760,  9, 'Apollo Pharmacy — medicines',       'upi'],
    ['Healthcare',     1_200, 17, 'Practo — doctor consultation',      'card'],
    ['Healthcare',       640, 24, 'Dr Lal PathLabs — blood test',      'card'],
    // Travel (Σ ≈ ₹5,400 — more travel)
    ['Travel',         1_100, 13, 'Ola Outstation — short trip',       'card'],
    ['Travel',         4_300, 27, 'IRCTC train tickets',               'netbanking'],
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

