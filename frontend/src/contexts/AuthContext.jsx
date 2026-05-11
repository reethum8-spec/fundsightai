import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, USE_MOCK } from '@/lib/supabaseClient'

const AuthContext = createContext(null)
const MOCK_KEY = 'fs-mock-user'
const REAL = !!supabase && !USE_MOCK

/**
 * Auth provider that transparently uses Supabase Auth when configured,
 * and falls back to a localStorage-based mock for offline/dev mode.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(REAL) // wait for getSession in real mode
  const [pendingEmail, setPendingEmail] = useState(null) // for "check your inbox" UX

  // ---------------- Mock-mode bootstrap ----------------
  useEffect(() => {
    if (REAL) return
    try {
      const stored = JSON.parse(localStorage.getItem(MOCK_KEY) || 'null')
      if (stored) setUser(stored)
    } catch {
      /* ignore */
    }
  }, [])

  // ---------------- Real Supabase bootstrap ----------------
  useEffect(() => {
    if (!REAL) return
    let mounted = true

    const hydrate = async (session) => {
      if (!mounted) return
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }
      const u = session.user
      // Pull profile row (role, full_name) — non-blocking; falls back to metadata.
      let role = u.user_metadata?.role || 'personal'
      let name = u.user_metadata?.full_name || u.email?.split('@')[0]
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', u.id)
          .maybeSingle()
        if (profile) {
          role = profile.role || role
          name = profile.full_name || name
        }
      } catch {
        /* profiles table may not exist yet — ignore */
      }
      setUser({ id: u.id, email: u.email, name, role })
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => hydrate(session))
    return () => { mounted = false; sub.subscription.unsubscribe() }
  }, [])

  // ---------------- Mock persistence ----------------
  useEffect(() => {
    if (REAL) return
    if (user) localStorage.setItem(MOCK_KEY, JSON.stringify(user))
    else localStorage.removeItem(MOCK_KEY)
  }, [user])

  // ---------------- Actions ----------------
  const login = useCallback(async ({ email, password }) => {
    setLoading(true)
    try {
      if (REAL) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // user state hydrated by onAuthStateChange
      } else {
        await new Promise(r => setTimeout(r, 400))
        setUser({ id: 'mock-1', email, name: email.split('@')[0], role: 'org_admin' })
      }
    } finally {
      if (!REAL) setLoading(false)
    }
  }, [])

  const signup = useCallback(async ({ email, password, name, role = 'personal' }) => {
    setLoading(true)
    try {
      if (REAL) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, role },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) throw error
        // If email confirmation is required, no session is returned.
        if (!data.session) setPendingEmail(email)
      } else {
        await new Promise(r => setTimeout(r, 500))
        setUser({ id: 'mock-' + Date.now(), email, name, role })
      }
    } finally {
      if (!REAL) setLoading(false)
    }
  }, [])

  const loginWithGoogle = useCallback(async () => {
    if (REAL) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      })
      if (error) throw error
      // browser will redirect; nothing else to do here
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    setUser({ id: 'mock-google', email: 'demo@google.com', name: 'Demo User', role: 'org_admin' })
    setLoading(false)
  }, [])

  const logout = useCallback(async () => {
    if (REAL) await supabase.auth.signOut()
    setUser(null)
  }, [])

  const hasRole = useCallback(
    (...roles) => !!user && roles.flat().includes(user.role),
    [user],
  )

  const value = {
    user, loading, pendingEmail, isReal: REAL,
    login, signup, loginWithGoogle, logout, hasRole,
    clearPendingEmail: () => setPendingEmail(null),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
