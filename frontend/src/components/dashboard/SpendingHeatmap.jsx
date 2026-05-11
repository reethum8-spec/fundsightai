import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/utils'

const WEEKS = 12
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function startOfWeek(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  // ISO Mon = 0
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * 12-week × 7-day grid of total spend per day.
 * `expenses` items must have `amount` and `occurred_at` (or `date`).
 */
export function SpendingHeatmap({ expenses = [] }) {
  const [hover, setHover] = useState(null)

  const { grid, max, totals, anchor } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const anchor = startOfWeek(today)
    anchor.setDate(anchor.getDate() - (WEEKS - 1) * 7)

    const totals = new Map()
    for (const e of expenses) {
      const d = new Date(e.occurred_at || e.date)
      if (Number.isNaN(+d)) continue
      const k = dateKey(d)
      totals.set(k, (totals.get(k) || 0) + Number(e.amount || 0))
    }

    const grid = []
    let max = 0
    for (let w = 0; w < WEEKS; w++) {
      const col = []
      for (let day = 0; day < 7; day++) {
        const cellDate = new Date(anchor)
        cellDate.setDate(anchor.getDate() + w * 7 + day)
        const k = dateKey(cellDate)
        const value = totals.get(k) || 0
        if (value > max) max = value
        col.push({ date: cellDate, key: k, value, future: cellDate > today })
      }
      grid.push(col)
    }
    return { grid, max, totals, anchor }
  }, [expenses])

  const intensity = (v) => {
    if (!v) return 0
    if (max <= 0) return 0
    // 5 buckets
    const r = v / max
    if (r > 0.75) return 4
    if (r > 0.5) return 3
    if (r > 0.25) return 2
    return 1
  }

  const cellClass = (lvl, future) => {
    if (future) return 'bg-muted/40'
    return [
      'bg-muted/60',
      'bg-primary/20',
      'bg-primary/40',
      'bg-primary/65',
      'bg-primary',
    ][lvl]
  }

  const monthLabels = useMemo(() => {
    const labels = []
    let lastMonth = -1
    grid.forEach((col, w) => {
      const m = col[0].date.getMonth()
      if (m !== lastMonth) {
        labels.push({ w, label: col[0].date.toLocaleString('en', { month: 'short' }) })
        lastMonth = m
      }
    })
    return labels
  }, [grid])

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-[3px] text-[10px] text-muted-foreground pt-4">
          {DAYS.map((d, i) => (
            <span key={d} className="h-3 leading-3" style={{ visibility: i % 2 ? 'visible' : 'hidden' }}>{d}</span>
          ))}
        </div>
        <div className="relative flex-1 overflow-x-auto">
          <div className="relative h-3 mb-1">
            {monthLabels.map(m => (
              <span
                key={m.w}
                className="absolute text-[10px] text-muted-foreground"
                style={{ left: `calc(${m.w} * (0.75rem + 3px))` }}
              >
                {m.label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {grid.map((col, w) => (
              <div key={w} className="flex flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    onMouseEnter={() => setHover(cell)}
                    onMouseLeave={() => setHover(null)}
                    className={`w-3 h-3 rounded-[3px] transition ${cellClass(intensity(cell.value), cell.future)} ring-1 ring-inset ring-border/30`}
                    title={`${cell.key} · ${formatCurrency(cell.value)}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div className="min-h-[1.25rem]">
          {hover && !hover.future && (
            <span>
              <span className="text-foreground font-medium">{formatCurrency(hover.value)}</span>
              <span> on {hover.date.toLocaleDateString()}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map(l => (
            <span key={l} className={`w-3 h-3 rounded-[3px] ${cellClass(l, false)} ring-1 ring-inset ring-border/30`} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
