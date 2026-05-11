import { motion } from 'framer-motion'
import { Sparkles, TriangleAlert, TrendingUp, ThumbsUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'

const meta = {
  recommendation: { icon: Sparkles, tone: 'primary', label: 'Recommendation', cls: 'bg-primary/10 text-primary' },
  alert: { icon: TriangleAlert, tone: 'danger', label: 'Anomaly', cls: 'bg-red-500/10 text-red-500' },
  forecast: { icon: TrendingUp, tone: 'warning', label: 'Forecast', cls: 'bg-amber-500/10 text-amber-500' },
  positive: { icon: ThumbsUp, tone: 'success', label: 'Positive', cls: 'bg-emerald-500/10 text-emerald-500' },
}

export function AIInsights({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((it, i) => {
        const m = meta[it.type] || meta.recommendation
        const Icon = m.icon
        return (
          <motion.li
            key={it.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="flex gap-3 rounded-xl border border-border p-3 hover:bg-muted/40 transition"
          >
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${m.cls}`}>
              <Icon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate">{it.title}</p>
                <Badge tone={m.tone}>{m.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{it.body}</p>
            </div>
          </motion.li>
        )
      })}
    </ul>
  )
}
