import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/utils'

export function SavingsGoals({ goals, onUpsert, onRemove }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', saved: '', deadline: '' })

  const reset = () => { setForm({ name: '', target: '', saved: '', deadline: '' }); setEditing(null) }
  const start = (g = null) => {
    if (g) {
      setEditing(g)
      setForm({ name: g.name, target: g.target, saved: g.saved, deadline: g.deadline || '' })
    } else reset()
    setOpen(true)
  }
  const save = () => {
    if (!form.name || !form.target) return
    onUpsert({
      ...(editing || {}),
      name: form.name,
      target: Number(form.target) || 0,
      saved: Number(form.saved) || 0,
      deadline: form.deadline || null,
    })
    setOpen(false)
    reset()
  }

  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        {goals.length === 0 && (
          <p className="text-sm text-muted-foreground col-span-full">No goals yet. Add one to start saving.</p>
        )}
        {goals.map(g => {
          const pct = g.target > 0 ? Math.min(1, g.saved / g.target) : 0
          return (
            <button
              key={g.id}
              onClick={() => start(g)}
              className="text-left rounded-xl border border-border p-4 hover:bg-muted/40 transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Target size={16} /></div>
                  <div>
                    <div className="font-medium text-sm">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{g.deadline || 'No deadline'}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(g.id) }}
                  className="opacity-0 group-hover:opacity-100 transition btn-ghost p-1.5 rounded-lg text-muted-foreground hover:text-red-500"
                  aria-label="Remove"
                ><Trash2 size={13} /></button>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <span className="font-display text-lg font-semibold">{formatCurrency(g.saved)}</span>
                <span className="text-xs text-muted-foreground">of {formatCurrency(g.target)}</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }} animate={{ width: `${(pct * 100).toFixed(0)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary to-accent"
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">{(pct * 100).toFixed(0)}% complete</div>
            </button>
          )
        })}
      </div>
      <Button variant="outline" className="mt-3 w-full" onClick={() => start(null)}><Plus size={14} /> Add goal</Button>

      <Modal
        open={open}
        onClose={() => { setOpen(false); reset() }}
        title={editing ? 'Edit goal' : 'New savings goal'}
        footer={
          <>
            <Button variant="outline" onClick={() => { setOpen(false); reset() }}>Cancel</Button>
            <Button onClick={save}>{editing ? 'Save changes' : 'Add goal'}</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Name"><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Emergency fund" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target (USD)"><Input type="number" min="0" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} /></Field>
            <Field label="Saved so far"><Input type="number" min="0" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} /></Field>
          </div>
          <Field label="Deadline (optional)"><Input type="date" value={form.deadline || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} /></Field>
        </div>
      </Modal>
    </>
  )
}
