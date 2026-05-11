import { useState } from 'react'
import { FileBarChart, FileDown, Sparkles, Loader2 } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { Badge } from '@/components/ui/Badge'
import { useReports } from '@/hooks/useReports'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/utils'

export default function Reports() {
  const { reports, loading, error, generate, download } = useReports()
  const toast = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [downloadingId, setDownloadingId] = useState(null)
  const [form, setForm] = useState({ title: '', period_start: '', period_end: '' })

  const onGenerate = async () => {
    setGenerating(true)
    try {
      const r = await generate({
        title: form.title || undefined,
        period_start: form.period_start || undefined,
        period_end: form.period_end || undefined,
      })
      toast.success('Report generated')
      setModalOpen(false)
      setForm({ title: '', period_start: '', period_end: '' })
      // Auto-download fresh report
      try { await download(r) } catch { /* user can still click later */ }
    } catch (e) {
      toast.error(e?.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const onDownload = async (r) => {
    setDownloadingId(r.id)
    try { await download(r) }
    catch (e) { toast.error('Download failed') }
    finally { setDownloadingId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">PDF financial reports with AI observations.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Sparkles size={16} /> Generate report</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Past reports</CardTitle>
          <CardDescription>{loading ? 'Loading…' : `${reports.length} report${reports.length === 1 ? '' : 's'}`}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {error && (
            <div className="px-6 py-3 text-sm text-red-500 border-y border-red-500/20 bg-red-500/5">
              Failed to load: {error.message}
            </div>
          )}
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileBarChart className="mx-auto mb-3 opacity-50" />
              No reports yet. Click <span className="text-foreground font-medium">Generate report</span> to make your first one.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {reports.map(r => (
                <li key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 transition">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileBarChart size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.title}</span>
                      <Badge tone="default">PDF</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      <span>{new Date(r.generated_at).toLocaleString()}</span>
                      {r.period_start && <span>· {r.period_start} → {r.period_end || 'today'}</span>}
                      {r.kpis?.total_expenses != null && <span>· Spend {formatCurrency(r.kpis.total_expenses)}</span>}
                      {r.kpis?.anomalies != null && <span>· {r.kpis.anomalies} anomalies</span>}
                      <span>· {(r.size_bytes / 1024).toFixed(0)} KB</span>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => onDownload(r)} disabled={downloadingId === r.id}>
                    {downloadingId === r.id ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    Download
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => !generating && setModalOpen(false)}
        title="Generate financial report"
        description="Leave dates blank for an all-time report."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={generating}>Cancel</Button>
            <Button onClick={onGenerate} disabled={generating}>
              {generating ? <><Loader2 size={14} className="animate-spin" /> Building PDF…</> : 'Generate'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Title (optional)">
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="May 2026 board report" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Period start">
              <Input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))} />
            </Field>
            <Field label="Period end">
              <Input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))} />
            </Field>
          </div>
          <p className="text-xs text-muted-foreground">
            Reports include KPIs, charts, AI observations, and your top expenses for the period.
          </p>
        </div>
      </Modal>
    </div>
  )
}
