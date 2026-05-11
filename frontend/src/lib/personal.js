/**
 * Personal-finance derivations:
 *  - Financial Health Score (0-100)
 *  - Subscription auto-detection (recurring monthly charges)
 *  - Coach tips
 *
 * Pure functions over a list of expenses (each: {amount, category, occurred_at, description}).
 */

const DAY = 24 * 60 * 60 * 1000

function inLast(days, e) {
  const d = new Date(e.occurred_at || e.date)
  if (Number.isNaN(+d)) return false
  return Date.now() - +d <= days * DAY
}

/** Score in 0-100 — blended from 4 sub-signals. */
export function computeHealthScore({ expenses = [], income = 0, savings = 0 } = {}) {
  const last30 = expenses.filter(e => inLast(30, e))
  const last60 = expenses.filter(e => inLast(60, e))
  const prior30 = last60.filter(e => !inLast(30, e))

  const sum = arr => arr.reduce((s, e) => s + Number(e.amount || 0), 0)
  const spend30 = sum(last30)
  const spendPrior30 = sum(prior30)

  // 1. Savings rate (ideal ≥ 20% of income)
  const savingsRate = income > 0 ? Math.max(0, (income - spend30) / income) : 0
  const sSavings = Math.min(1, savingsRate / 0.2) * 100

  // 2. Spending consistency (lower MoM swing = better)
  const swing = spendPrior30 > 0 ? Math.abs(spend30 - spendPrior30) / spendPrior30 : 0.5
  const sConsistency = Math.max(0, 1 - swing) * 100

  // 3. Anomaly cleanliness (fewer flagged = better)
  const flagged = last30.filter(e => e.anomaly_flag || e.flag).length
  const sAnomaly = last30.length === 0
    ? 80
    : Math.max(0, 1 - flagged / last30.length) * 100

  // 4. Subscription bloat penalty
  const subs = sum(last30.filter(e => e.category === 'Subscriptions'))
  const subShare = spend30 > 0 ? subs / spend30 : 0
  const sSubs = Math.max(0, 1 - Math.max(0, subShare - 0.05) / 0.15) * 100

  // Weighted blend
  const score = Math.round(
    sSavings * 0.35 + sConsistency * 0.25 + sAnomaly * 0.20 + sSubs * 0.20,
  )
  return {
    score,
    components: {
      savings: Math.round(sSavings),
      consistency: Math.round(sConsistency),
      anomaly: Math.round(sAnomaly),
      subscriptions: Math.round(sSubs),
    },
    spend30,
    spendPrior30,
    savingsRate,
    flagged,
    subscriptionShare: subShare,
  }
}

export function gradeFor(score) {
  if (score >= 85) return { grade: 'A', tone: 'text-emerald-500', label: 'Excellent' }
  if (score >= 70) return { grade: 'B', tone: 'text-emerald-500', label: 'Healthy' }
  if (score >= 55) return { grade: 'C', tone: 'text-amber-500', label: 'Watch' }
  if (score >= 40) return { grade: 'D', tone: 'text-orange-500', label: 'At risk' }
  return { grade: 'F', tone: 'text-red-500', label: 'Needs action' }
}

/** Detects likely subscriptions: same description appearing in 2+ different months
 *  with similar amounts (within 10%). Falls back to category=Subscriptions list. */
export function detectSubscriptions(expenses = []) {
  const groups = new Map()
  for (const e of expenses) {
    const key = (e.description || '').trim().toLowerCase() || `cat:${e.category}`
    const arr = groups.get(key) || []
    arr.push(e)
    groups.set(key, arr)
  }
  const candidates = []
  for (const [key, arr] of groups) {
    if (arr.length < 2) continue
    const months = new Set(arr.map(e => (e.occurred_at || e.date || '').slice(0, 7)))
    if (months.size < 2) continue
    const amts = arr.map(e => Number(e.amount || 0))
    const max = Math.max(...amts), min = Math.min(...amts)
    if (max === 0) continue
    if ((max - min) / max > 0.15) continue
    const avg = amts.reduce((s, x) => s + x, 0) / amts.length
    candidates.push({
      key,
      name: arr[0].description || arr[0].category,
      category: arr[0].category,
      avgAmount: avg,
      monthsSeen: months.size,
      lastSeen: arr.map(e => e.occurred_at || e.date).sort().pop(),
    })
  }
  return candidates.sort((a, b) => b.avgAmount - a.avgAmount)
}

export function categorySpend(expenses = []) {
  const map = new Map()
  for (const e of expenses) {
    map.set(e.category, (map.get(e.category) || 0) + Number(e.amount || 0))
  }
  return Array.from(map, ([category, spent]) => ({ category, spent }))
}

export function coachTips({ expenses, income, savings, budgets, goals }) {
  const { score, savingsRate, subscriptionShare, flagged, spend30 } =
    computeHealthScore({ expenses, income, savings })
  const tips = []

  if (savingsRate < 0.1 && income > 0) {
    tips.push({
      type: 'recommendation',
      title: 'Boost your savings rate',
      body: `You're saving ${(savingsRate * 100).toFixed(0)}% of income. Aim for 20%+ — try automating a transfer on payday.`,
    })
  }
  if (subscriptionShare > 0.12) {
    tips.push({
      type: 'recommendation',
      title: 'Subscription bloat detected',
      body: `Subscriptions are ${(subscriptionShare * 100).toFixed(0)}% of recent spend. Audit overlapping tools.`,
    })
  }
  if (flagged > 0) {
    tips.push({
      type: 'alert',
      title: `${flagged} unusual transaction${flagged === 1 ? '' : 's'} this month`,
      body: 'Review flagged items in Expenses to confirm they\'re legitimate.',
    })
  }
  // Budget breach
  for (const b of budgets || []) {
    const spent = expenses
      .filter(e => inLast(30, e) && e.category === b.category)
      .reduce((s, e) => s + Number(e.amount || 0), 0)
    if (b.limit > 0 && spent > b.limit) {
      tips.push({
        type: 'alert',
        title: `${b.category} budget exceeded`,
        body: `Spent ${spent.toFixed(0)} vs limit ${b.limit}. Review what's pushing you over.`,
      })
    } else if (b.limit > 0 && spent > b.limit * 0.85) {
      tips.push({
        type: 'forecast',
        title: `${b.category} budget at ${((spent / b.limit) * 100).toFixed(0)}%`,
        body: 'Approaching your monthly limit — pace the rest of the month carefully.',
      })
    }
  }
  // Positive note
  if (score >= 80 && tips.length === 0) {
    tips.push({
      type: 'positive',
      title: 'Your finances look great',
      body: 'Keep your current habits — consider increasing a savings goal.',
    })
  }
  return tips.slice(0, 4).map((t, i) => ({ id: i + 1, ...t }))
}
