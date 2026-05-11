import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'
import { AuthShell } from './Login.jsx'

const ROLES = [
  { id: 'personal', label: 'Personal', desc: 'Manage my own finance' },
  { id: 'org_admin', label: 'Organization', desc: 'NGO, startup, business' },
  { id: 'team_member', label: 'Team member', desc: 'Joining an existing org' },
]

export default function Signup() {
  const { signup, loginWithGoogle, loading, pendingEmail, clearPendingEmail, isReal, user } = useAuth()
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'org_admin' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup(form)
      // In real mode with email confirmation, no session yet → stay on page and show notice.
      // In mock mode (or if confirmation is disabled), AuthContext sets the user → redirect.
      if (!isReal || user) nav('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Signup failed')
    }
  }

  if (pendingEmail) {
    return <AuthShell title="Check your inbox" subtitle={`We sent a confirmation link to ${pendingEmail}.`}>
      <p className="text-sm text-muted-foreground">
        Click the link in the email to activate your account. You can close this tab.
      </p>
      <Button variant="outline" className="w-full mt-6" onClick={() => { clearPendingEmail(); nav('/login') }}>
        Back to sign in
      </Button>
    </AuthShell>
  }

  return <AuthShell title="Create your account" subtitle="Start tracking funds with AI in minutes">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ada Lovelace" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required minLength={6} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="At least 6 characters" />
      </div>
      <div className="space-y-1.5">
        <Label>Account type</Label>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map(r => (
            <button
              type="button"
              key={r.id}
              onClick={() => setForm(f => ({ ...f, role: r.id }))}
              className={
                'rounded-xl border px-3 py-2.5 text-left text-xs transition ' +
                (form.role === r.id
                  ? 'border-primary/60 bg-primary/10'
                  : 'border-border hover:bg-muted')
              }
            >
              <div className="font-medium text-sm">{r.label}</div>
              <div className="text-muted-foreground mt-0.5">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</Button>
    </form>

    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
    </div>
    <Button variant="outline" className="w-full" onClick={async () => { await loginWithGoogle(); nav('/dashboard', { replace: true }) }}>
      Continue with Google
    </Button>
    <p className="text-sm text-center text-muted-foreground mt-6">
      Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
    </p>
  </AuthShell>
}
