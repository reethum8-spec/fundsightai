import { motion } from 'framer-motion'
import { gradeFor } from '@/lib/personal'

export function HealthScore({ score, components }) {
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, score)) / 100)
  const grade = gradeFor(score)

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-40 h-40 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
          <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
          <motion.circle
            cx="80" cy="80" r={r} fill="none" strokeWidth="14" strokeLinecap="round"
            stroke="url(#hgrad)"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="hgrad" x1="0" y1="0" x2="160" y2="160">
              <stop offset="0%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`font-display text-4xl font-semibold ${grade.tone}`}>{score}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-wider">{grade.label}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 flex-1 w-full">
        {[
          ['Savings rate', components.savings, 'Emergency cushion + future growth'],
          ['Consistency', components.consistency, 'Stable spend month-over-month'],
          ['Anomalies', components.anomaly, 'Few unusual transactions'],
          ['Subscriptions', components.subscriptions, 'Recurring costs in check'],
        ].map(([label, value, hint]) => (
          <div key={label} className="rounded-xl border border-border p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-semibold tabular-nums">{value}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${value}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-primary to-accent"
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5">{hint}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
