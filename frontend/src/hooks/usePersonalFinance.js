/**
 * Local-first personal finance store. Persists in localStorage so users can
 * try the feature instantly. In Phase 10 this gets backed by Supabase tables
 * `personal_budgets` and `personal_goals`.
 */
import { useCallback, useEffect, useState } from 'react'

const KEY = 'fs-personal-v3-inr'

/**
 * Realistic urban-Indian personal-finance baseline:
 *  Income      ₹80,000 / month
 *  Spending    ~₹45,000 / month  (budgeted, across rent + lifestyle + bills)
 *  Net saving  ~₹20,000 / month  (with a ₹15k buffer for irregular costs)
 *  Cumulative  ₹2,40,000 saved   (≈3 months of expenses → emergency-fund grade)
 *
 * Numbers reconcile with the demo expense slice in `lib/mockData.js`
 * (`personalExpenses`) so the Financial Health Score lands in the
 * "Healthy / B" band (~72-78) without any data import.
 */
const DEFAULTS = {
  income: 80_000,
  savings: 2_40_000,
  budgets: [
    { id: 'b1', category: 'Rent',          limit: 18_000 },
    { id: 'b2', category: 'Food',          limit:  9_000 },
    { id: 'b3', category: 'Transport',     limit:  3_500 },
    { id: 'b4', category: 'Utilities',     limit:  3_000 },
    { id: 'b5', category: 'Subscriptions', limit:  1_500 },
    { id: 'b6', category: 'Shopping',      limit:  5_000 },
    { id: 'b7', category: 'Healthcare',    limit:  2_000 },
    { id: 'b8', category: 'Travel',        limit:  3_000 },
  ],
  goals: [
    { id: 'g1', name: 'Emergency fund', target: 3_60_000, saved: 2_40_000, deadline: '2026-12-31' },
    { id: 'g2', name: 'Goa trip',       target: 1_50_000, saved:   40_000, deadline: '2026-10-31' },
    { id: 'g3', name: 'New laptop',     target:   90_000, saved:   55_000, deadline: '2026-08-31' },
  ],
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null')
    return raw ? { ...DEFAULTS, ...raw } : DEFAULTS
  } catch { return DEFAULTS }
}

export function usePersonalFinance() {
  const [state, setState] = useState(load)

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(state)) }, [state])

  const setIncome = useCallback(income => setState(s => ({ ...s, income: Number(income) || 0 })), [])
  const setSavings = useCallback(savings => setState(s => ({ ...s, savings: Number(savings) || 0 })), [])

  const upsertBudget = useCallback((b) => {
    setState(s => {
      const existing = s.budgets.findIndex(x => x.id === b.id || x.category === b.category)
      if (existing >= 0) {
        const next = [...s.budgets]
        next[existing] = { ...next[existing], ...b }
        return { ...s, budgets: next }
      }
      return { ...s, budgets: [...s.budgets, { id: 'b' + Date.now(), ...b }] }
    })
  }, [])

  const removeBudget = useCallback((id) => {
    setState(s => ({ ...s, budgets: s.budgets.filter(b => b.id !== id) }))
  }, [])

  const upsertGoal = useCallback((g) => {
    setState(s => {
      const existing = s.goals.findIndex(x => x.id === g.id)
      if (existing >= 0) {
        const next = [...s.goals]
        next[existing] = { ...next[existing], ...g }
        return { ...s, goals: next }
      }
      return { ...s, goals: [...s.goals, { id: 'g' + Date.now(), saved: 0, ...g }] }
    })
  }, [])

  const removeGoal = useCallback((id) => {
    setState(s => ({ ...s, goals: s.goals.filter(g => g.id !== id) }))
  }, [])

  const reset = useCallback(() => setState(DEFAULTS), [])

  return {
    ...state,
    setIncome, setSavings,
    upsertBudget, removeBudget,
    upsertGoal, removeGoal,
    reset,
  }
}
