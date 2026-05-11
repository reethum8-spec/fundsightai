import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Receipt, Upload, X, Download, Sparkles } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { ExpenseFormModal } from '@/components/expenses/ExpenseFormModal'
import { CsvImportModal } from '@/components/expenses/CsvImportModal'
import { useExpenses } from '@/hooks/useExpenses'
import { useFunds } from '@/hooks/useFunds'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/utils'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { downloadSampleCsv, loadDemoData } from '@/lib/demoData'

export default function Expenses() {
  const [filters, setFilters] = useState({ category: '', from: '', to: '' })
  const { expenses, loading, error, create, update, remove, importCsv } = useExpenses(filters)
  const { funds } = useFunds()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [csvOpen, setCsvOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)

  const onDownloadSample = async () => {
    try {
      await downloadSampleCsv()
      toast.success('Sample CSV downloaded')
    } catch (err) {
      toast.error(err?.message || 'Could not download sample CSV')
    }
  }

  const onTryDemo = async () => {
    if (loadingDemo) return
    setLoadingDemo(true)
    try {
      const r = await loadDemoData(importCsv)
      toast.success(`Demo data loaded · ${r.inserted}/${r.total} rows`)
    } catch (err) {
      toast.error(err?.message || 'Failed to load demo data')
    } finally {
      setLoadingDemo(false)
    }
  }

  const fundsById = useMemo(() => Object.fromEntries(funds.map(f => [f.id, f])), [funds])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return expenses
    return expenses.filter(e =>
      (e.description || '').toLowerCase().includes(s) ||
      (e.category || '').toLowerCase().includes(s) ||
      (e.location || '').toLowerCase().includes(s)
    )
  }, [expenses, q])

  const total = filtered.reduce((s, e) => s + Number(e.amount || 0), 0)
  const flagged = filtered.filter(e => e.anomaly_flag || e.flag).length

  const onSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (editing) {
        await update(editing.id, payload)
        toast.success('Expense updated')
      } else {
        await create(payload)
        toast.success('Expense added')
      }
      setEditorOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirmDelete = async () => {
    const e = confirmDelete
    setConfirmDelete(null)
    try {
      await remove(e.id)
      toast.success('Expense deleted')
    } catch (err) {
      toast.error(`Delete failed: ${err.message}`)
    }
  }

  const onImport = async (file) => {
    setImporting(true)
    try {
      const r = await importCsv(file)
      toast.success(`Imported ${r.inserted} of ${r.total} rows`)
      return r
    } finally {
      setImporting(false)
    }
  }

  const clearFilters = () => setFilters({ category: '', from: '', to: '' })
  const filtersActive = !!(filters.category || filters.from || filters.to)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">Every transaction, categorized and AI-monitored.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onDownloadSample}>
            <Download size={16} /> Download sample
          </Button>
          <Button variant="outline" onClick={onTryDemo} disabled={loadingDemo}>
            <Sparkles size={16} /> {loadingDemo ? 'Loading…' : 'Try demo data'}
          </Button>
          <Button variant="outline" onClick={() => setCsvOpen(true)}><Upload size={16} /> Import CSV</Button>
          <Button onClick={() => { setEditing(null); setEditorOpen(true) }}><Plus size={16} /> New expense</Button>
        </div>
      </div>

      <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Stat label="Showing" value={`${filtered.length}`} />
        <Stat label="Total" value={formatCurrency(total)} tone="primary" />
        <Stat label="Flagged" value={flagged} tone={flagged ? 'warning' : 'default'} />
        <Stat label="Categories" value={new Set(filtered.map(e => e.category)).size} />
      </section>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>{loading ? 'Loading…' : `${filtered.length} matching expenses`}</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} className="pl-9" placeholder="Search descriptions…" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} className="max-w-[180px]">
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className="max-w-[170px]" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className="max-w-[170px]" />
            {filtersActive && (
              <button onClick={clearFilters} className="btn-ghost text-xs gap-1"><X size={12} /> Clear</button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="px-6 py-3 text-sm text-red-500 border-y border-red-500/20 bg-red-500/5">
              Failed to load: {error.message}
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                <tr className="border-y border-border">
                  <th className="text-left font-medium px-6 py-3">Date</th>
                  <th className="text-left font-medium px-6 py-3">Description</th>
                  <th className="text-left font-medium px-6 py-3">Category</th>
                  <th className="text-left font-medium px-6 py-3">Project</th>
                  <th className="text-right font-medium px-6 py-3">Amount</th>
                  <th className="text-right font-medium px-6 py-3">AI</th>
                  <th className="text-right font-medium px-6 py-3 w-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-20" /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Receipt className="mx-auto mb-3 opacity-50" />
                      No expenses match. Try clearing filters or add one.
                    </td></tr>
                  ) : filtered.map(e => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{e.occurred_at || e.date}</td>
                      <td className="px-6 py-3 max-w-xs truncate">{e.description || '—'}</td>
                      <td className="px-6 py-3"><Badge>{e.category}</Badge></td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {e.project_id ? (fundsById[e.project_id]?.project_name || '—') : '—'}
                      </td>
                      <td className="px-6 py-3 text-right font-medium tabular-nums">{formatCurrency(e.amount)}</td>
                      <td className="px-6 py-3 text-right">
                        {(e.anomaly_flag ?? e.flag) ? <Badge tone="danger">Anomaly</Badge> : <Badge tone="success">OK</Badge>}
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button onClick={() => { setEditing(e); setEditorOpen(true) }} className="btn-ghost p-2 rounded-lg" aria-label="Edit"><Pencil size={15} /></button>
                        <button onClick={() => setConfirmDelete(e)} className="btn-ghost p-2 rounded-lg text-red-500" aria-label="Delete"><Trash2 size={15} /></button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ExpenseFormModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmit}
        initial={editing}
        submitting={submitting}
        funds={funds}
      />

      <CsvImportModal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        onImport={onImport}
        importing={importing}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete expense?"
        description={confirmDelete ? `${formatCurrency(confirmDelete.amount)} · ${confirmDelete.description || '(no description)'} ` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button onClick={onConfirmDelete} className="bg-red-500 hover:brightness-110 shadow-red-500/20">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This action can't be undone.</p>
      </Modal>
    </div>
  )
}

function Stat({ label, value, tone = 'default' }) {
  const tones = {
    default: 'text-foreground',
    primary: 'text-primary',
    warning: 'text-amber-500',
  }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
      <div className={`mt-1.5 font-display text-2xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  )
}
