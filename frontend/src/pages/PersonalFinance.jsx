import { useMemo, useState } from 'react'
import { Sparkles, Settings, RotateCcw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Field, Input } from '@/components/ui/Input'
import { HealthScore } from '@/components/personal/HealthScore'
import { BudgetTracker } from '@/components/personal/BudgetTracker'
import { SavingsGoals } from '@/components/personal/SavingsGoals'
import { Subscriptions } from '@/components/personal/Subscriptions'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { useExpenses } from '@/hooks/useExpenses'
import { usePersonalFinance } from '@/hooks/usePersonalFinance'
import { useToast } from '@/contexts/ToastContext'
import { computeHealthScore, coachTips } from '@/lib/personal'
import { formatCurrency } from '@/lib/utils'
import { personalExpenses as demoPersonalExpenses } from '@/lib/mockData'

export default function PersonalFinance() {
  const { expenses: liveExpenses, loading } = useExpenses()
  const pf = usePersonalFinance()
  const toast = useToast()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [draft, setDraft] = useState({ income: pf.income, savings: pf.savings })

  // Fall back to the curated personal-finance demo slice when there's nothing
  // imported yet — keeps the Health Score, budgets and subscriptions panels
  // realistic instead of all zeros / a fake 100/100.
  const expenses = useMemo(
    () => (liveExpenses && liveExpenses.length ? liveExpenses : demoPersonalExpenses),
    [liveExpenses],
  )

  const score = useMemo(
    () => computeHealthScore({ expenses, income: pf.income, savings: pf.savings }),
    [expenses, pf.income, pf.savings],
  )

  const tips = useMemo(
    () => coachTips({ expenses, income: pf.income, savings: pf.savings, budgets: pf.budgets, goals: pf.goals }),
    [expenses, pf.income, pf.savings, pf.budgets, pf.goals],
  )

  const openSettings = () => { setDraft({ income: pf.income, savings: pf.savings }); setSettingsOpen(true) }
  const saveSettings = () => {
    pf.setIncome(draft.income)
    pf.setSavings(draft.savings)
    setSettingsOpen(false)
    toast.success('Profile updated')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Personal Finance</h1>
          <p className="text-sm text-muted-foreground mt-1">Your financial health, budgets, and goals — all in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="info">Local profile</Badge>
          <Button variant="outline" onClick={openSettings}><Settings size={14} /> Profile</Button>
        </div>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Financial Health Score</CardTitle>
            <CardDescription>Composite of savings rate, consistency, anomaly cleanliness, and subscription bloat</CardDescription>
          </CardHeader>
          <CardContent>
            <HealthScore score={score.score} components={score.components} />
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <Stat label="Income (monthly)" value={formatCurrency(pf.income)} />
              <Stat label="Spent (last 30d)" value={formatCurrency(score.spend30)} />
              <Stat label="Savings" value={formatCurrency(pf.savings)} tone="text-emerald-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>AI Coach</CardTitle>
              <CardDescription>Tailored to your data</CardDescription>
            </div>
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Sparkles size={16} /></div>
          </CardHeader>
          <CardContent>
            {tips.length === 0
              ? <p className="text-sm text-muted-foreground">No tips right now — looking good.</p>
              : <AIInsights items={tips} />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>Monthly limits per category. Spend rolls over from your expenses.</CardDescription>
          </CardHeader>
          <CardContent>
            <BudgetTracker
              budgets={pf.budgets}
              expenses={expenses}
              onUpsert={pf.upsertBudget}
              onRemove={pf.removeBudget}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriptions</CardTitle>
            <CardDescription>Auto-detected recurring charges</CardDescription>
          </CardHeader>
          <CardContent>
            {loading
              ? <p className="text-sm text-muted-foreground">Loading…</p>
              : <Subscriptions expenses={expenses} />}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>Click any goal to update progress</CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsGoals goals={pf.goals} onUpsert={pf.upsertGoal} onRemove={pf.removeGoal} />
          </CardContent>
        </Card>
      </section>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Personal profile"
        description="Used to compute your savings rate and health score."
        footer={
          <>
            <Button variant="ghost" onClick={() => { pf.reset(); setSettingsOpen(false); toast.info('Reset to defaults') }}><RotateCcw size={14} /> Reset</Button>
            <div className="flex-1" />
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveSettings}>Save</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monthly income (₹)">
            <Input type="number" min="0" value={draft.income} onChange={e => setDraft(d => ({ ...d, income: Number(e.target.value) || 0 }))} />
          </Field>
          <Field label="Current savings (₹)">
            <Input type="number" min="0" value={draft.savings} onChange={e => setDraft(d => ({ ...d, savings: Number(e.target.value) || 0 }))} />
          </Field>
        </div>
      </Modal>
    </div>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display text-lg font-semibold ${tone || ''}`}>{value}</div>
    </div>
  )
}
