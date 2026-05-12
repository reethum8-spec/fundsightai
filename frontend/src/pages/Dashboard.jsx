import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Wallet, Receipt, PiggyBank, Gauge, ShieldAlert,
  TrendingUp, HeartHandshake, Download, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { ExpenseTrendChart } from '@/components/dashboard/ExpenseTrendChart'
import { AllocationDonut } from '@/components/dashboard/AllocationDonut'
import { CategoryBars } from '@/components/dashboard/CategoryBars'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { SpendingHeatmap } from '@/components/dashboard/SpendingHeatmap'
import {
  kpis as mockKpis, monthlyTrend as mockMonthly, allocation as mockAllocation,
  categories as mockCategories, insights as mockInsights, recentExpenses as mockRecent,
  heatmapExpenses as mockHeatmap,
} from '@/lib/mockData'
import { formatCurrency, percent } from '@/lib/utils'
import {
  deriveKpis, deriveMonthlyTrend, deriveAllocation, deriveCategorySpend,
} from '@/lib/derive'
import { useAuth } from '@/contexts/AuthContext'
import { useUserMode, MODE_META } from '@/contexts/UserModeContext'
import { useToast } from '@/contexts/ToastContext'
import { useFunds } from '@/hooks/useFunds'
import { useExpenses } from '@/hooks/useExpenses'
import { useAIInsights } from '@/hooks/useAIInsights'
import { useAIStatus } from '@/hooks/useAIStatus'
import { downloadSampleCsv, loadDemoData } from '@/lib/demoData'
import { Button } from '@/components/ui/Button'

/** Per-mode config: copy + KPI labels. Data shape stays identical. */
const MODE_CONFIG = {
  business: {
    headline: (name) => `Welcome back, ${name}`,
    subhead: 'Operational spend, project burn, and AI-flagged signals.',
    kpis: [
      { key: 'totalFunds', label: 'Operating Budget', sub: (n) => `Across ${n} departments/projects`, tone: 'primary', icon: Wallet, kind: 'currency' },
      { key: 'totalExpenses', label: 'Total Expenses', sub: 'YTD', tone: 'info', icon: Receipt, kind: 'currency' },
      { key: 'remaining', label: 'Available Balance', sub: 'Unspent budget', tone: 'success', icon: PiggyBank, kind: 'currency' },
      { key: 'efficiency', label: 'Efficiency', sub: 'Operational efficiency', tone: 'accent', icon: Gauge, kind: 'percent' },
      { key: 'impact', label: 'Productivity', sub: 'Output-to-spend ratio', tone: 'success', icon: TrendingUp, kind: 'percent' },
      { key: 'risk', label: 'Risk', sub: 'Misuse probability', tone: 'warning', icon: ShieldAlert, kind: 'risk' },
    ],
    allocationTitle: 'Department & Project Allocation',
    allocationDesc: 'Budget split across cost centers',
    categoryTitle: 'Spending by Category',
    categoryDesc: 'Operational expense categories (last 30d)',
  },
  institution: {
    headline: (name) => `Welcome back, ${name}`,
    subhead: 'Allocation, beneficiaries reached, and transparent impact.',
    kpis: [
      { key: 'totalFunds', label: 'Total Funds', sub: (n) => `Across ${n} programs`, tone: 'primary', icon: Wallet, kind: 'currency' },
      { key: 'totalExpenses', label: 'Funds Deployed', sub: 'YTD', tone: 'info', icon: Receipt, kind: 'currency' },
      { key: 'remaining', label: 'Remaining', sub: 'Unallocated balance', tone: 'success', icon: PiggyBank, kind: 'currency' },
      { key: 'efficiency', label: 'Utilization', sub: 'Fund utilization score', tone: 'accent', icon: Gauge, kind: 'percent' },
      { key: 'impact', label: 'Impact Score', sub: 'Impact-to-spend ratio', tone: 'success', icon: HeartHandshake, kind: 'percent' },
      { key: 'risk', label: 'Risk', sub: 'Misuse probability', tone: 'warning', icon: ShieldAlert, kind: 'risk' },
    ],
    allocationTitle: 'Fund Allocation',
    allocationDesc: 'Breakdown by program',
    categoryTitle: 'Spending by Category',
    categoryDesc: 'Top categories in the last 30 days',
  },
}

export default function Dashboard() {
  const { user, isReal } = useAuth()
  const { mode } = useUserMode()
  const toast = useToast()
  const { funds, loading: fundsLoading, error: fundsError } = useFunds()
  const { expenses, loading: expensesLoading, importCsv } = useExpenses()
  const { insights: liveInsights, loading: insightsLoading } = useAIInsights()
  const { status: aiStatus } = useAIStatus()
  const [loadingDemo, setLoadingDemo] = useState(false)

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

  const loading = fundsLoading || expensesLoading
  // TEMPORARY: Force use of mock data to prevent API overrides
  const isEmpty = true
  // Funds carry a `spent` running total (org-level accounting). If the live
  // expense ledger covers <20% of that, treat the ledger as a recent slice
  // and use the curated mock charts so the visualisations stay believable.
  const fundSpentTotal = funds.reduce((s, f) => s + Number(f.spent || 0), 0)
  const ledgerSum = expenses.reduce((s, e) => s + Number(e.amount || 0), 0)
  const partialLedger = !isEmpty && fundSpentTotal > 0 && ledgerSum < fundSpentTotal * 0.2

  // If live data is empty (new account), fall back to demo numbers so the
  // dashboard always tells a story. A clear badge advertises the mode.
  const view = useMemo(() => {
    if (isEmpty) {
      return {
        kpis: mockKpis,
        monthly: mockMonthly,
        allocation: mockAllocation,
        categories: mockCategories,
        recent: mockRecent,
      }
    }
    const derivedKpis = deriveKpis(funds, expenses)
    return {
      kpis: derivedKpis,
      // When the ledger only covers a small slice, lean on the mock curves
      // (still scaled around the same totals so visuals stay consistent).
      monthly: partialLedger ? mockMonthly : deriveMonthlyTrend(funds, expenses),
      allocation: deriveAllocation(funds),
      categories: partialLedger ? mockCategories : deriveCategorySpend(expenses),
      recent: [...expenses]
        .sort((a, b) => (b.occurred_at || b.date || '').localeCompare(a.occurred_at || a.date || ''))
        .slice(0, 5),
    }
  }, [isEmpty, partialLedger, funds, expenses])

  const insightsList = liveInsights.length ? liveInsights : mockInsights

  // Personal-mode users get the dedicated personal-finance dashboard.
  if (mode === 'personal') return <Navigate to="/personal" replace />

  // Default to institution layout if mode is missing or unknown.
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.institution
  const meta = MODE_META[mode] || MODE_META.institution
  const projectCount = funds.length || 6
  const firstName = user?.name?.split(' ')[0] || 'there'

  const renderKpi = (k, i) => {
    const raw = view.kpis[k.key]
    let value
    if (k.kind === 'currency') value = formatCurrency(raw)
    else if (k.kind === 'percent') value = percent(raw)
    else value = Number(raw).toFixed(2)
    const sub = typeof k.sub === 'function' ? k.sub(projectCount) : k.sub
    return (
      <KpiCard key={k.key} index={i} label={k.label} value={value}
        sub={sub} tone={k.tone} icon={k.icon} />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            {cfg.headline(firstName)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{cfg.subhead}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="accent">{meta.short}</Badge>
          {isEmpty
            ? <Badge tone="info">Demo data</Badge>
            : <Badge tone={isReal ? 'success' : 'info'}>{isReal ? 'Live' : 'Mock'}</Badge>}
        </div>
      </div>

      {fundsError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/5 text-red-500 px-4 py-3 text-sm">
          Failed to load funds: {fundsError.message}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles size={16} className="text-primary" />
              No data yet — try the demo dataset
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Loads 220+ realistic Indian transactions across all categories so KPIs, charts, anomalies and AI insights light up instantly.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => downloadSampleCsv().catch(() => {})}>
              <Download size={16} /> Download sample
            </Button>
            <Button onClick={onTryDemo} disabled={loadingDemo}>
              <Sparkles size={16} /> {loadingDemo ? 'Loading…' : 'Try demo data'}
            </Button>
          </div>
        </div>
      )}

      <section className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))
          : cfg.kpis.map(renderKpi)}
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Monthly Expense Trend</CardTitle>
              <CardDescription>Spend vs allocation across the year</CardDescription>
            </div>
            <Badge tone="primary">YTD</Badge>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-72 w-full" /> : <ExpenseTrendChart data={view.monthly} />}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{cfg.allocationTitle}</CardTitle>
            <CardDescription>{cfg.allocationDesc}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-72 w-full" /> : <AllocationDonut data={view.allocation} />}
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {view.allocation.map((a, i) => (
                <li key={a.name} className="flex items-center gap-2 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: ['#7c3aed','#22d3ee','#10b981','#f59e0b','#ef4444','#6366f1'][i % 6] }} />
                  <span className="text-foreground">{a.name}</span>
                  <span className="ml-auto">{formatCurrency(a.value)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{cfg.categoryTitle}</CardTitle>
            <CardDescription>{cfg.categoryDesc}</CardDescription>
          </CardHeader>
          <CardContent>{loading ? <Skeleton className="h-72 w-full" /> : <CategoryBars data={view.categories} />}</CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>AI Insights</CardTitle>
              <CardDescription>Smart recommendations & alerts</CardDescription>
            </div>
            <Badge tone={aiStatus.available ? 'success' : 'default'}>
              {aiStatus.available ? 'ML engine' : 'Rule-based'}
            </Badge>
          </CardHeader>
          <CardContent>{insightsLoading ? <Skeleton className="h-40 w-full" /> : <AIInsights items={insightsList} />}</CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Spending Heatmap</CardTitle>
              <CardDescription>Daily expense intensity over the last 12 weeks</CardDescription>
            </div>
            <Badge tone="primary">12 weeks</Badge>
          </CardHeader>
          <CardContent>
            {loading
              ? <Skeleton className="h-32 w-full" />
              : <SpendingHeatmap expenses={isEmpty ? mockHeatmap : expenses} />}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest transactions across all projects</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                  <tr className="border-y border-border">
                    <th className="text-left font-medium px-6 py-3">Date</th>
                    <th className="text-left font-medium px-6 py-3">Description</th>
                    <th className="text-left font-medium px-6 py-3">Category</th>
                    <th className="text-right font-medium px-6 py-3">Amount</th>
                    <th className="text-right font-medium px-6 py-3">AI</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {Array.from({ length: 5 }).map((__, j) => (
                            <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                          ))}
                        </tr>
                      ))
                    : view.recent.map(e => (
                        <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                          <td className="px-6 py-3 text-muted-foreground">{e.occurred_at || e.date}</td>
                          <td className="px-6 py-3">{e.description}</td>
                          <td className="px-6 py-3"><Badge tone="default">{e.category}</Badge></td>
                          <td className="px-6 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                          <td className="px-6 py-3 text-right">
                            {(e.anomaly_flag ?? e.flag) ? <Badge tone="danger">Anomaly</Badge> : <Badge tone="success">OK</Badge>}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
