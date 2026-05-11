import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants'

const empty = {
  amount: '',
  category: 'Operations',
  occurred_at: new Date().toISOString().slice(0, 10),
  description: '',
  payment_method: 'card',
  location: '',
  beneficiary: '',
  project_id: '',
}

export function ExpenseFormModal({ open, onClose, onSubmit, initial, submitting, funds = [] }) {
  const editing = !!initial?.id
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(initial ? { ...empty, ...initial } : empty)
    }
  }, [open, initial])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount) || 0,
        project_id: form.project_id || null,
      })
    } catch (err) {
      if (err?.fields) setErrors(err.fields)
      else setErrors({ _form: err?.message || 'Failed to save' })
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={editing ? 'Edit expense' : 'New expense'}
      description="Track a transaction against a project or category."
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Saving…' : (editing ? 'Save changes' : 'Add expense')}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (USD)" htmlFor="amount" error={errors.amount}>
            <Input id="amount" type="number" step="0.01" min="0" value={form.amount} onChange={set('amount')} placeholder="0.00" required />
          </Field>
          <Field label="Date" htmlFor="occurred_at" error={errors.occurred_at}>
            <Input id="occurred_at" type="date" value={form.occurred_at || ''} onChange={set('occurred_at')} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select id="category" value={form.category} onChange={set('category')}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Payment method" htmlFor="payment_method" error={errors.payment_method}>
            <Select id="payment_method" value={form.payment_method} onChange={set('payment_method')}>
              {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Project" htmlFor="project_id" error={errors.project_id} hint="Optional — link to a fund">
          <Select id="project_id" value={form.project_id || ''} onChange={set('project_id')}>
            <option value="">— None —</option>
            {funds.map(f => <option key={f.id} value={f.id}>{f.project_name}</option>)}
          </Select>
        </Field>
        <Field label="Description" htmlFor="description" error={errors.description}>
          <Textarea id="description" value={form.description || ''} onChange={set('description')} placeholder="What was this for?" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Location" htmlFor="location" error={errors.location}>
            <Input id="location" value={form.location || ''} onChange={set('location')} placeholder="HQ" />
          </Field>
          <Field label="Beneficiary" htmlFor="beneficiary" error={errors.beneficiary}>
            <Input id="beneficiary" value={form.beneficiary || ''} onChange={set('beneficiary')} placeholder="Name or group" />
          </Field>
        </div>
        {errors._form && <p className="text-sm text-red-500">{errors._form}</p>}
      </form>
    </Modal>
  )
}
