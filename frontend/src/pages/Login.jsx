import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { login, loginWithGoogle, loading } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const from = loc.state?.from?.pathname || '/dashboard'
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await login(form)
      nav(from, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed')
    }
  }

  return <AuthShell title="Welcome back" subtitle="Sign in to your FundSight account">
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required autoComplete="email"
          value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          placeholder="you@company.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required autoComplete="current-password"
          value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder="••••••••" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
    </form>
    <Divider />
    <Button variant="outline" className="w-full" onClick={async () => { await loginWithGoogle(); nav(from, { replace: true }) }}>
      <GoogleIcon /> Continue with Google
    </Button>
    <p className="text-sm text-center text-muted-foreground mt-6">
      No account? <Link to="/signup" className="text-primary hover:underline">Create one</Link>
    </p>
  </AuthShell>
}

export function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen relative grid lg:grid-cols-2">
      <div className="blob bg-primary/30 w-[400px] h-[400px] top-0 -left-20" />
      <div className="blob bg-accent/30 w-[400px] h-[400px] bottom-0 -right-20" />
      <div className="absolute top-4 left-4"><Link to="/"><Logo /></Link></div>
      <div className="absolute top-4 right-4"><ThemeToggle /></div>

      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground mt-2">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <div className="hidden lg:block relative overflow-hidden border-l border-border bg-gradient-to-br from-primary/10 via-card to-accent/10">
        <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <div className="relative h-full flex items-center justify-center p-10">
          <blockquote className="glass-card p-8 max-w-md">
            <p className="font-display text-xl leading-relaxed">
              “FundSight gave our board a clear, real-time picture of every dollar spent. The AI alerts paid for the year-one subscription in week two.”
            </p>
            <footer className="mt-4 text-sm text-muted-foreground">— CFO, BrightFutures NGO</footer>
          </blockquote>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
      <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or</span></div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#FFC107" d="M21.8 10.2H12v3.9h5.6c-.5 2.6-2.7 4-5.6 4a6.1 6.1 0 0 1 0-12.2c1.5 0 2.8.5 3.9 1.4l2.8-2.8A10 10 0 1 0 12 22c5.8 0 9.7-4.1 9.7-9.9 0-.7-.1-1.4-.2-1.9z"/><path fill="#FF3D00" d="M3.2 7.3l3.2 2.4A6 6 0 0 1 12 6c1.5 0 2.8.5 3.9 1.4l2.8-2.8A10 10 0 0 0 3.2 7.3z"/><path fill="#4CAF50" d="M12 22a10 10 0 0 0 6.7-2.6l-3.1-2.5a6 6 0 0 1-9-3l-3.1 2.4A10 10 0 0 0 12 22z"/><path fill="#1976D2" d="M21.8 10.2H12v3.9h5.6a6 6 0 0 1-2 2.8l3.1 2.5c-.2.2 3.3-2.4 3.3-7.3 0-.7-.1-1.4-.2-1.9z"/></svg>
  )
}
