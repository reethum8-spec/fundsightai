import { Repeat } from 'lucide-react'
import { detectSubscriptions } from '@/lib/personal'
import { formatCurrency } from '@/lib/utils'

export function Subscriptions({ expenses }) {
  const subs = detectSubscriptions(expenses).slice(0, 8)
  if (!subs.length) {
    return <p className="text-sm text-muted-foreground">No recurring charges detected yet.</p>
  }
  const monthly = subs.reduce((s, x) => s + x.avgAmount, 0)
  return (
    <>
      <div className="rounded-xl border border-border p-3 mb-3 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="text-xs text-muted-foreground">Estimated monthly</div>
        <div className="font-display text-2xl font-semibold mt-0.5">{formatCurrency(monthly)}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subs.length} recurring charge{subs.length === 1 ? '' : 's'} detected</div>
      </div>
      <ul className="space-y-2">
        {subs.map(s => (
          <li key={s.key} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Repeat size={14} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate capitalize">{s.name}</div>
              <div className="text-xs text-muted-foreground">{s.category} · {s.monthsSeen} months</div>
            </div>
            <div className="text-sm font-medium tabular-nums">{formatCurrency(s.avgAmount)}</div>
          </li>
        ))}
      </ul>
    </>
  )
}
