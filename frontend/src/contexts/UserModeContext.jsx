import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { USE_MOCK } from '@/lib/supabaseClient'

/**
 * Three usage modes for FundSight AI. Each mode swaps the dashboard layout,
 * sidebar labels, and KPI focus. Default is `null` (forces onboarding).
 *
 *  - personal     → Personal Finance (budgeting, savings, subscriptions, health score)
 *  - business     → Office / Business (departments, projects, ops efficiency)
 *  - institution  → Institution / NGO (allocation, beneficiaries, transparency, impact)
 *
 * Persistence: localStorage for reliable persistence across sessions and navigation.
 * The mode is reset on explicit logout only, not on page navigation or refresh.
 */
const STORAGE_KEY = 'fs-user-mode'
export const USER_MODES = ['personal', 'business', 'institution']

const UserModeContext = createContext(null)

export function UserModeProvider({ children }) {
  const { user } = useAuth() || {}

  const [mode, setModeState] = useState(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      return USER_MODES.includes(v) ? v : null
    } catch {
      return null
    }
  })

  // Persist across sessions.
  useEffect(() => {
    try {
      if (mode) localStorage.setItem(STORAGE_KEY, mode)
      else localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [mode])

  // Reset the mode on explicit logout only (user becomes null).
  // Do not reset on user ID changes or navigation.
  useEffect(() => {
    if (user === null) {
      setModeState(null)
      try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
  }, [user])

  const setMode = useCallback((m) => {
    if (USER_MODES.includes(m)) setModeState(m)
  }, [])

  const reset = useCallback(() => setModeState(null), [])

  return (
    <UserModeContext.Provider value={{ mode, setMode, reset }}>
      {children}
    </UserModeContext.Provider>
  )
}

export const useUserMode = () => useContext(UserModeContext)

export const MODE_META = {
  personal: {
    label: 'Personal Finance',
    short: 'Personal',
    tagline: 'Smart budgeting, savings & spending intelligence.',
    accent: 'from-fuchsia-500/40 via-purple-500/30 to-indigo-500/40',
  },
  business: {
    label: 'Office / Business',
    short: 'Business',
    tagline: 'Department budgets, projects & operational efficiency.',
    accent: 'from-cyan-400/40 via-sky-500/30 to-indigo-500/40',
  },
  institution: {
    label: 'Institution / NGO',
    short: 'Institution',
    tagline: 'Fund allocation, beneficiaries & transparent impact.',
    accent: 'from-emerald-400/40 via-teal-500/30 to-cyan-500/40',
  },
}
