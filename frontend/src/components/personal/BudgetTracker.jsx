import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select } from '@/components/ui/Input'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const DAY = 24 * 60 * 60 * 1000

function spentInLast30(expenses, category) {
  return expenses
    .filter(e => e.category === category && Date.now() - +new Date(e.occurred_at || e.date) <= 30 * DAY)
    .reduce((s, e) => s + Number(e.amount || 0), 0)
}

export function BudgetTracker({ budgets, expenses, onUpsert, onRemove }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ category: 'Groceries', limit: '' })

  const add = () => {
    if (!form.limit) return
    onUpsert({ category: form.category, limit: Number(form.limit) })
    setOpen(false)
    setForm({ category: 'Groceries', limit: '' })
  }

  return (
    <>
      <div className="space-y-3">
        {budgets.length === 0 && (
          <p className="text-sm text-muted-foreground">No budgets yet. Add one to start tracking.</p>
        )}
        {budgets.map(b => {
          const spent = spentInLast30(expenses, b.category)
          const pct = b.limit > 0 ? Math.min(1, spent / b.limit) : 0
          const tone = pct >= 1 ? 'bg-red-500' : pct >= 0.85 ? 'bg-amber-500' : 'bg-emerald-500'
          return (
            <div key={b.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{b.category}</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatCurrency(spent)} <span className="opacity-60">/ {formatCurrency(b.limit)}</span>
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={`h-full ${tone} transition-all`} style={{ width: `${(pct * 100).toFixed(0)}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{(pct * 100).toFixed(0)}% used (last 30 days)</span>
                <button onClick={() => onRemove(b.id)} className="btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-red-500" aria-label="Remove">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
        <Button variant="outline" className="w-full" onClick={() => setOpen(true)}><Plus size={14} /> Add budget</Button>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New monthly budget"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={add}>Add</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Category">
            <Select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Monthly limit (USD)">
            <Input type="number" min="0" step="10" value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} placeholder="500" />
          </Field>
        </div>
      </Modal>
    </>
  )
}
