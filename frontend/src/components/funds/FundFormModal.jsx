import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { PROJECT_CATEGORIES } from '@/lib/constants'

const empty = {
  project_name: '',
  category: 'Education',
  budget: '',
  expected_impact: '',
  beneficiaries_count: '',
  deadline: '',
}

export function FundFormModal({ open, onClose, onSubmit, initial, submitting }) {
  const editing = !!initial?.id
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setErrors({})
      setForm(initial ? { ...empty, ...initial, deadline: initial.deadline || '' } : empty)
    }
  }, [open, initial])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setErrors({})
    try {
      await onSubmit({
        ...form,
        budget: Number(form.budget) || 0,
        beneficiaries_count: form.beneficiaries_count ? Number(form.beneficiaries_count) : 0,
        deadline: form.deadline || null,
      })
    } catch (err) {
      if (err?.fields) setErrors(err.fields)
      else setErrors({ _form: err?.message || 'Failed to save' })
    }
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={editing ? 'Edit project' : 'New project'}
      description="Allocate a budget and define expected impact."
      footer={
        <>
          <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? 'Saving…' : (editing ? 'Save changes' : 'Create project')}</Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Project name" htmlFor="project_name" error={errors.project_name}>
          <Input id="project_name" value={form.project_name} onChange={set('project_name')} placeholder="Rural Education Initiative" required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select id="category" value={form.category} onChange={set('category')}>
              {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Budget (USD)" htmlFor="budget" error={errors.budget}>
            <Input id="budget" type="number" min="0" step="100" value={form.budget} onChange={set('budget')} placeholder="50000" required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Beneficiaries" htmlFor="beneficiaries_count" error={errors.beneficiaries_count}
                 hint="Estimated count">
            <Input id="beneficiaries_count" type="number" min="0" value={form.beneficiaries_count} onChange={set('beneficiaries_count')} placeholder="0" />
          </Field>
          <Field label="Deadline" htmlFor="deadline" error={errors.deadline}>
            <Input id="deadline" type="date" value={form.deadline || ''} onChange={set('deadline')} />
          </Field>
        </div>
        <Field label="Expected impact" htmlFor="expected_impact" error={errors.expected_impact} hint="One or two sentences">
          <Textarea id="expected_impact" value={form.expected_impact || ''} onChange={set('expected_impact')}
                    placeholder="e.g. Reach 5,000 students across 20 villages" />
        </Field>
        {errors._form && <p className="text-sm text-red-500">{errors._form}</p>}
      </form>
    </Modal>
  )
}
