import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Logo } from '@/components/Logo'

/**
 * Supabase redirects here after Google OAuth or email confirmation.
 * The supabase-js client auto-detects the session from the URL hash;
 * we just wait for it and then route the user.
 */
export default function AuthCallback() {
  const nav = useNavigate()

  useEffect(() => {
    if (!supabase) {
      nav('/login', { replace: true })
      return
    }
    let active = true
    const goto = (path) => active && nav(path, { replace: true })

    // detectSessionInUrl is enabled by default; getSession reflects it.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) goto('/dashboard')
      else {
        // Listen briefly in case the hash hasn't been parsed yet
        const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
          if (session) goto('/dashboard')
        })
        setTimeout(() => { sub.subscription.unsubscribe(); goto('/login') }, 4000)
      }
    })

    return () => { active = false }
  }, [nav])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      <Logo />
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        Completing sign-in…
      </div>
    </div>
  )
}
