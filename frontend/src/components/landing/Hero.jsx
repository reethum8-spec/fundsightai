import { motion } from 'framer-motion'
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="blob bg-primary/40 w-[480px] h-[480px] -top-32 -left-24" />
      <div className="blob bg-accent/40 w-[420px] h-[420px] top-10 right-0" />
      <div className="absolute inset-0 bg-grid-light dark:bg-grid-dark [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />

      <div className="relative mx-auto max-w-7xl px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          <Sparkles size={14} className="text-primary" />
          AI-driven financial intelligence — now in private beta
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-6 font-display text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight leading-[1.05]"
        >
          Where every dollar
          <br />
          tells its <span className="gradient-text">true story</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground"
        >
          Track allocation, detect anomalies, predict overruns, and visualize impact —
          for NGOs, startups, institutions, and individuals. One unified intelligence layer.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link to="/signup">
            <Button className="px-6 py-3">Start free <ArrowRight size={16} /></Button>
          </Link>
          <a href="#features" className="btn-outline px-5 py-3">See how it works</a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.25 }}
          className="mt-16 mx-auto max-w-5xl"
        >
          <div className="glass-card p-3 sm:p-4">
            <div className="rounded-xl overflow-hidden border border-border bg-gradient-to-br from-background to-muted">
              <HeroPreview />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={14} className="text-emerald-500" />
            SOC2-ready architecture · End-to-end auditable · Role-based access
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function HeroPreview() {
  // Lightweight inline mock dashboard to suggest the product without loading a real chart on first paint.
  return (
    <div className="grid grid-cols-12 gap-3 p-4 text-left">
      <div className="col-span-12 md:col-span-3 grid gap-3">
        {[
          { l: 'Total Funds', v: '$1.25M', t: 'text-primary' },
          { l: 'Efficiency', v: '86%', t: 'text-emerald-500' },
          { l: 'Risk Score', v: '0.18', t: 'text-amber-500' },
        ].map(k => (
          <div key={k.l} className="rounded-xl border border-border p-4">
            <div className="text-xs text-muted-foreground">{k.l}</div>
            <div className={`mt-1 font-display text-2xl ${k.t}`}>{k.v}</div>
          </div>
        ))}
      </div>
      <div className="col-span-12 md:col-span-9 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm">Monthly Expense Trend</div>
          <div className="text-xs text-muted-foreground">YTD</div>
        </div>
        <svg viewBox="0 0 600 180" className="mt-3 w-full h-44">
          <defs>
            <linearGradient id="hg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(262 90% 66%)" stopOpacity=".5" />
              <stop offset="100%" stopColor="hsl(262 90% 66%)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0,140 C40,120 80,130 120,100 C160,70 200,90 240,70 C280,50 320,80 360,60 C400,40 440,55 480,35 C520,20 560,30 600,15 L600,180 L0,180 Z"
            fill="url(#hg)"
          />
          <path
            d="M0,140 C40,120 80,130 120,100 C160,70 200,90 240,70 C280,50 320,80 360,60 C400,40 440,55 480,35 C520,20 560,30 600,15"
            fill="none" stroke="hsl(262 90% 66%)" strokeWidth="2.5"
          />
        </svg>
      </div>
    </div>
  )
}
