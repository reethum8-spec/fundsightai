import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet, Building2, HeartHandshake, ArrowRight, Sparkles, Check,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { useUserMode, MODE_META } from '@/contexts/UserModeContext'
import { cn } from '@/lib/utils'

const MODES = [
  {
    id: 'personal',
    icon: Wallet,
    title: 'Personal Finance',
    blurb: 'Track budgets, savings, subscriptions and your financial health — for individuals and families.',
    perks: ['Smart budgeting', 'Savings goals', 'Subscription detection', 'AI coach'],
    gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    glow: 'shadow-[0_0_60px_-20px_rgba(168,85,247,0.55)]',
  },
  {
    id: 'business',
    icon: Building2,
    title: 'Office / Business',
    blurb: 'Manage department budgets, projects and operational expenses with AI-driven efficiency analytics.',
    perks: ['Department budgets', 'Project spend', 'Team expenses', 'Efficiency score'],
    gradient: 'from-cyan-400 via-sky-500 to-indigo-500',
    glow: 'shadow-[0_0_60px_-20px_rgba(14,165,233,0.55)]',
  },
  {
    id: 'institution',
    icon: HeartHandshake,
    title: 'Institution / NGO',
    blurb: 'Allocate funds, track beneficiaries, prove impact and maintain transparent stewardship at scale.',
    perks: ['Fund allocation', 'Beneficiary tracking', 'Transparency metrics', 'Impact score'],
    gradient: 'from-emerald-400 via-teal-500 to-cyan-500',
    glow: 'shadow-[0_0_60px_-20px_rgba(20,184,166,0.55)]',
  },
]

export default function Welcome() {
  const { user } = useAuth()
  const { mode, setMode } = useUserMode()
  const navigate = useNavigate()
  const [picked, setPicked] = useState(null)

  // If they've already chosen, send them to dashboard.
  if (mode) return <Navigate to="/dashboard" replace />
  // Onboarding requires auth.
  if (!user) return <Navigate to="/login" replace />

  const onContinue = () => {
    if (!picked) return
    setMode(picked)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Backdrop glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-32 h-96 w-96 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute top-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.06)_1px,transparent_0)] [background-size:28px_28px]" />
      </div>

      <header className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-2xl mx-auto pt-6 sm:pt-12"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur">
            <Sparkles size={12} className="text-primary" />
            Welcome{user?.name ? `, ${user.name}` : ''}
          </span>
          <h1 className="mt-4 font-display text-3xl sm:text-5xl font-semibold tracking-tight">
            How will you use{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-fuchsia-500 via-cyan-400 to-emerald-400">
              FundSight AI?
            </span>
          </h1>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg">
            Pick a workspace. We'll tailor the dashboard, KPIs and AI insights to match.
          </p>
        </motion.div>

        <div className="mt-10 sm:mt-14 grid gap-5 md:grid-cols-3">
          {MODES.map((m, i) => {
            const isPicked = picked === m.id
            return (
              <motion.button
                key={m.id}
                type="button"
                onClick={() => setPicked(m.id)}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'group relative text-left rounded-3xl p-6 sm:p-7',
                  'border border-white/10 bg-card/40 backdrop-blur-xl',
                  'transition-all duration-300',
                  isPicked
                    ? `ring-2 ring-primary ${m.glow}`
                    : 'hover:border-white/20 hover:bg-card/60',
                )}
              >
                {/* Gradient halo */}
                <div className={cn(
                  'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10',
                  'bg-gradient-to-br', m.gradient, 'blur-2xl scale-90',
                )} style={{ opacity: isPicked ? 0.25 : undefined }} />

                {/* Selected check */}
                {isPicked && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className="absolute top-4 right-4 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
                  >
                    <Check size={14} strokeWidth={3} />
                  </motion.div>
                )}

                <div className={cn(
                  'inline-flex items-center justify-center w-12 h-12 rounded-2xl text-white',
                  'bg-gradient-to-br shadow-lg', m.gradient,
                )}>
                  <m.icon size={22} />
                </div>

                <h3 className="mt-5 font-display text-xl font-semibold tracking-tight">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{m.blurb}</p>

                <ul className="mt-5 space-y-1.5">
                  {m.perks.map(p => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn(
                        'w-1.5 h-1.5 rounded-full bg-gradient-to-r', m.gradient,
                      )} />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.button>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onContinue}
            disabled={!picked}
            className={cn(
              'group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-medium transition-all',
              picked
                ? 'bg-foreground text-background hover:scale-[1.02] shadow-xl'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {picked ? `Continue as ${MODE_META[picked].short}` : 'Select a workspace to continue'}
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
          <p className="text-xs text-muted-foreground">You can switch anytime from the sidebar.</p>
        </motion.div>
      </main>
    </div>
  )
}
