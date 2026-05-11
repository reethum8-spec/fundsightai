import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

/**
 * Three usage modes for FundSight AI. Each mode swaps the dashboard layout,
 * sidebar labels, and KPI focus. Default is `null` (forces onboarding).
 *
 *  - personal     → Personal Finance (budgeting, savings, subscriptions, health score)
 *  - business     → Office / Business (departments, projects, ops efficiency)
 *  - institution  → Institution / NGO (allocation, beneficiaries, transparency, impact)
 *
 * Persistence: sessionStorage (not localStorage) so the workspace picker is
 * shown again on every fresh login. Within a single tab session the choice
 * survives page refresh and SPA navigation. The mode is also explicitly
 * reset whenever the authenticated user id changes (login / logout / switch).
 */
const STORAGE_KEY = 'fs-user-mode'
export const USER_MODES = ['personal', 'business', 'institution']

const UserModeContext = createContext(null)

export function UserModeProvider({ children }) {
  const { user } = useAuth() || {}

  const [mode, setModeState] = useState(() => {
    try {
      const v = sessionStorage.getItem(STORAGE_KEY)
      return USER_MODES.includes(v) ? v : null
    } catch {
      return null
    }
  })

  // Persist within the tab session only.
  useEffect(() => {
    try {
      if (mode) sessionStorage.setItem(STORAGE_KEY, mode)
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [mode])

  // Clear stale legacy localStorage entry left from older builds — otherwise
  // returning users keep auto-skipping the picker.
  useEffect(() => {
    try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
  }, [])

  // Reset the workspace selection on every auth transition (login, logout,
  // account switch) so the picker always greets a freshly authenticated user.
  const lastUserId = useRef(user?.id ?? null)
  useEffect(() => {
    const currentId = user?.id ?? null
    if (currentId !== lastUserId.current) {
      lastUserId.current = currentId
      setModeState(null)
      try { sessionStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    }
  }, [user?.id])

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
