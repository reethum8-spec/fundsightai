import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Wallet } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { FundFormModal } from '@/components/funds/FundFormModal'
import { useFunds } from '@/hooks/useFunds'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/utils'

export default function Funds() {
  const { funds, loading, error, create, update, remove } = useFunds()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return funds
    return funds.filter(f =>
      (f.project_name || '').toLowerCase().includes(s) ||
      (f.category || '').toLowerCase().includes(s)
    )
  }, [funds, q])

  const onCreate = () => { setEditing(null); setEditorOpen(true) }
  const onEdit = (f) => { setEditing(f); setEditorOpen(true) }

  const onSubmit = async (payload) => {
    setSubmitting(true)
    try {
      if (editing) {
        await update(editing.id, payload)
        toast.success('Project updated')
      } else {
        await create(payload)
        toast.success('Project created')
      }
      setEditorOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const onConfirmDelete = async () => {
    const f = confirmDelete
    setConfirmDelete(null)
    try {
      await remove(f.id)
      toast.success('Project deleted')
    } catch (e) {
      toast.error(`Delete failed: ${e.message}`)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Funds & Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">Allocate budgets and track project-level performance.</p>
        </div>
        <Button onClick={onCreate}><Plus size={16} /> New project</Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>All projects</CardTitle>
            <CardDescription>{loading ? 'Loading…' : `${filtered.length} of ${funds.length}`}</CardDescription>
          </div>
          <div className="relative w-full max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} className="pl-9" placeholder="Search projects…" />
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
                  <th className="text-left font-medium px-6 py-3">Project</th>
                  <th className="text-left font-medium px-6 py-3">Category</th>
                  <th className="text-right font-medium px-6 py-3">Budget</th>
                  <th className="text-right font-medium px-6 py-3">Spent</th>
                  <th className="text-left font-medium px-6 py-3">Utilization</th>
                  <th className="text-left font-medium px-6 py-3">Deadline</th>
                  <th className="text-right font-medium px-6 py-3 w-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                        ))}
                      </tr>
                    ))
                  : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">
                      <Wallet className="mx-auto mb-3 opacity-50" />
                      No projects yet. Click <span className="text-foreground font-medium">New project</span> to start.
                    </td></tr>
                  ) : filtered.map(f => {
                      const budget = Number(f.budget || 0)
                      const spent = Number(f.spent || 0)
                      const util = budget > 0 ? Math.min(1, spent / budget) : 0
                      const tone = util >= 0.95 ? 'danger' : util >= 0.75 ? 'warning' : 'success'
                      return (
                        <tr key={f.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                          <td className="px-6 py-3">
                            <div className="font-medium">{f.project_name}</div>
                            {f.expected_impact && <div className="text-xs text-muted-foreground line-clamp-1">{f.expected_impact}</div>}
                          </td>
                          <td className="px-6 py-3"><Badge>{f.category}</Badge></td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(budget)}</td>
                          <td className="px-6 py-3 text-right text-muted-foreground">{formatCurrency(spent)}</td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2 min-w-[140px]">
                              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                                <div className={`h-full ${tone === 'danger' ? 'bg-red-500' : tone === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(util * 100).toFixed(0)}%` }} />
                              </div>
                              <span className="text-xs tabular-nums w-10 text-right">{(util * 100).toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">{f.deadline || '—'}</td>
                          <td className="px-6 py-3 text-right whitespace-nowrap">
                            <button onClick={() => onEdit(f)} className="btn-ghost p-2 rounded-lg" aria-label="Edit"><Pencil size={15} /></button>
                            <button onClick={() => setConfirmDelete(f)} className="btn-ghost p-2 rounded-lg text-red-500" aria-label="Delete"><Trash2 size={15} /></button>
                          </td>
                        </tr>
                      )
                    })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <FundFormModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSubmit={onSubmit}
        initial={editing}
        submitting={submitting}
      />

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete project?"
        description={confirmDelete ? `"${confirmDelete.project_name}" will be permanently removed.` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button onClick={onConfirmDelete} className="bg-red-500 hover:brightness-110 shadow-red-500/20">Delete</Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">This will also detach related expenses (their <code>project_id</code> will be cleared).</p>
      </Modal>
    </div>
  )
}
