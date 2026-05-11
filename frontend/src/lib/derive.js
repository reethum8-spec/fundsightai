/**
 * Pure transformations from raw funds + expenses → dashboard view models.
 * Keeping this isolated so it's trivially testable in Phase 10.
 */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function deriveKpis(funds, expenses) {
  const totalFunds = funds.reduce((s, f) => s + Number(f.budget || 0), 0)
  // Prefer the fund-level `spent` running total when present (accurate for
  // organisations that book aggregate spend separately from the ledger);
  // fall back to summing the expense list when funds don't carry it.
  const fundSpentTotal = funds.reduce((s, f) => s + Number(f.spent || 0), 0)
  const expenseSum = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalExpenses = fundSpentTotal > 0 ? fundSpentTotal : expenseSum
  const remaining = Math.max(0, totalFunds - totalExpenses)
  // Utilization (0–1): how much of the budget has been deployed.
  const utilization = totalFunds > 0 ? totalExpenses / totalFunds : 0
  // Efficiency = pacing score. On-target spend gets ~0.8; overspend penalises.
  const efficiency = totalFunds > 0
    ? Math.max(0, Math.min(1, 1 - Math.max(0, utilization - 0.75) * 4))
    : 0
  // Anomaly rate from whatever expense ledger we have. Even a partial ledger
  // is a useful signal here.
  const flagged = expenses.filter(e => e.anomaly_flag).length
  const risk = expenses.length ? flagged / expenses.length : 0
  // Impact = beneficiary-reach efficiency. Lower ₹/head → higher score.
  // Benchmark band: ₹250 / head → 0.95 (excellent), ₹3,000 → 0.20.
  const totalBeneficiaries = funds.reduce((s, f) => s + Number(f.beneficiaries_count || 0), 0)
  const costPerHead = totalBeneficiaries > 0 ? totalExpenses / totalBeneficiaries : 0
  const impact = totalBeneficiaries > 0
    ? Math.max(0.1, Math.min(0.95, 0.95 - (costPerHead - 250) / 3600))
    : 0
  return { totalFunds, totalExpenses, remaining, efficiency, impact, risk }
}

export function deriveMonthlyTrend(funds, expenses) {
  const now = new Date()
  const monthlyAlloc = funds.reduce((s, f) => s + Number(f.budget || 0), 0) / 12
  const buckets = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
             month: MONTHS[d.getMonth()], expenses: 0, allocation: monthlyAlloc }
  })
  for (const e of expenses) {
    const d = new Date(e.occurred_at || e.date)
    if (Number.isNaN(+d)) continue
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const b = buckets.find(b => b.key === key)
    if (b) b.expenses += Number(e.amount || 0)
  }
  return buckets
}

export function deriveAllocation(funds) {
  const map = new Map()
  for (const f of funds) {
    map.set(f.category, (map.get(f.category) || 0) + Number(f.budget || 0))
  }
  return Array.from(map, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export function deriveCategorySpend(expenses) {
  const map = new Map()
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0))
  }
  return Array.from(map, ([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
}
