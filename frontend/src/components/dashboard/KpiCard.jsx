import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function KpiCard({ label, value, sub, delta, tone = 'primary', icon: Icon, index = 0 }) {
  const positive = (delta ?? 0) >= 0
  const tones = {
    primary: 'from-primary/15 to-primary/0 text-primary',
    accent: 'from-accent/15 to-accent/0 text-accent',
    success: 'from-emerald-500/15 to-emerald-500/0 text-emerald-500',
    warning: 'from-amber-500/15 to-amber-500/0 text-amber-500',
    danger: 'from-red-500/15 to-red-500/0 text-red-500',
    info: 'from-cyan-500/15 to-cyan-500/0 text-cyan-500',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-5"
    >
      <div className={cn('absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br blur-2xl opacity-70', tones[tone])} />
      <div className="relative flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {Icon && <Icon size={16} className="text-muted-foreground" />}
      </div>
      <div className="relative mt-3 flex items-end gap-2">
        <div className="font-display text-3xl font-semibold">{value}</div>
        {typeof delta === 'number' && (
          <div className={cn('flex items-center gap-0.5 text-xs font-medium pb-1', positive ? 'text-emerald-500' : 'text-red-500')}>
            {positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(delta).toFixed(1)}%
          </div>
        )}
      </div>
      {sub && <p className="relative mt-1 text-xs text-muted-foreground">{sub}</p>}
    </motion.div>
  )
}
