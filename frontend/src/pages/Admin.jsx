import { useState } from 'react'
import { Shield, Users, Wallet, Receipt, AlertTriangle, FileBarChart, Activity, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Input'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { formatCurrency } from '@/lib/utils'

const ROLES = ['personal', 'ngo_manager', 'org_admin', 'super_admin']

export default function Admin() {
  const { user } = useAuth()
  const toast = useToast()
  const { users, metrics, audit, flagged, setRole, removeUser } = useAdmin()
  const [roleModal, setRoleModal] = useState(null)
  const [roleValue, setRoleValue] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const onOpenRole = (u) => { setRoleModal(u); setRoleValue(u.role) }
  const onSaveRole = async () => {
    if (!roleModal) return
    try {
      await setRole(roleModal.id, roleValue)
      toast.success('Role updated')
      setRoleModal(null)
    } catch (e) { toast.error(e?.message || 'Failed') }
  }
  const onRemove = async (uid) => {
    if (!confirm('Delete this user?')) return
    try { await removeUser(uid); toast.success('User removed') }
    catch (e) { toast.error(e?.message || 'Failed') }
  }

  const m = metrics.data || {}
  const isSuper = user?.role === 'super_admin'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">System overview, user management, and audit log.</p>
        </div>
        <Badge tone="accent"><Shield size={12} /> {user?.role || 'admin'}</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {[
          { k: 'overview', label: 'Overview', icon: Activity },
          { k: 'users', label: 'Users', icon: Users },
          { k: 'flagged', label: 'Flagged', icon: AlertTriangle },
          { k: 'audit', label: 'Audit Log', icon: Clock },
        ].map(t => (
          <button
            key={t.k}
            onClick={() => setActiveTab(t.k)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition ${
              activeTab === t.k
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon size={14} />{t.label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === 'overview' && (
        <section className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <Stat label="Users" value={m.users ?? '—'} icon={Users} />
          <Stat label="Funds" value={m.funds ?? '—'} icon={Wallet} />
          <Stat label="Expenses" value={m.expenses ?? '—'} icon={Receipt} />
          <Stat label="Reports" value={m.reports ?? '—'} icon={FileBarChart} />
          <Stat label="Total Budget" value={m.total_budget != null ? formatCurrency(m.total_budget) : '—'} icon={Wallet} tone="primary" />
          <Stat label="Total Spent" value={m.total_spent != null ? formatCurrency(m.total_spent) : '—'} icon={Receipt} tone="warning" />
          <Stat label="Remaining" value={m.remaining != null ? formatCurrency(m.remaining) : '—'} icon={Wallet} tone="success" />
          <Stat label="Anomalies" value={m.anomalies ?? '—'} icon={AlertTriangle} tone={m.anomalies ? 'danger' : 'default'} />
        </section>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage roles and access</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                  <tr className="border-y border-border">
                    <th className="text-left font-medium px-6 py-3">Email</th>
                    <th className="text-left font-medium px-6 py-3">Name</th>
                    <th className="text-left font-medium px-6 py-3">Role</th>
                    <th className="text-left font-medium px-6 py-3">Status</th>
                    <th className="text-right font-medium px-6 py-3 w-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : users.data.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
                  ) : users.data.map(u => (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                      <td className="px-6 py-3">{u.email}</td>
                      <td className="px-6 py-3">{u.name}</td>
                      <td className="px-6 py-3"><Badge>{u.role}</Badge></td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.status === 'active' ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-muted'}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right whitespace-nowrap">
                        <button onClick={() => onOpenRole(u)} className="btn-ghost text-xs px-2 py-1 rounded-md">Edit role</button>
                        {isSuper && (
                          <button onClick={() => onRemove(u.id)} className="btn-ghost text-xs px-2 py-1 rounded-md text-red-500 ml-1">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flagged tab */}
      {activeTab === 'flagged' && (
        <Card>
          <CardHeader>
            <CardTitle>Flagged activity</CardTitle>
            <CardDescription>Anomalies and high-risk transactions</CardDescription>
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
                    <th className="text-left font-medium px-6 py-3">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {flagged.loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 5 }).map((__, j) => (
                          <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : flagged.data.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">Nothing flagged right now.</td></tr>
                  ) : flagged.data.map(e => (
                    <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                      <td className="px-6 py-3 text-muted-foreground">{e.occurred_at || e.date}</td>
                      <td className="px-6 py-3">{e.description || '—'}</td>
                      <td className="px-6 py-3"><Badge>{e.category}</Badge></td>
                      <td className="px-6 py-3 text-right font-medium">{formatCurrency(e.amount)}</td>
                      <td className="px-6 py-3"><Badge tone="danger">{e.reason}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Audit tab */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>Recent system changes</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase tracking-wide">
                  <tr className="border-y border-border">
                    <th className="text-left font-medium px-6 py-3">Time</th>
                    <th className="text-left font-medium px-6 py-3">Action</th>
                    <th className="text-left font-medium px-6 py-3">Actor</th>
                    <th className="text-left font-medium px-6 py-3">Target</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        {Array.from({ length: 4 }).map((__, j) => (
                          <td key={j} className="px-6 py-3"><Skeleton className="h-4 w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : audit.data.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-muted-foreground">No audit entries yet. Perform mutations to generate entries.</td></tr>
                  ) : audit.data.map(a => (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/40 transition">
                      <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">{new Date(a.timestamp).toLocaleString()}</td>
                      <td className="px-6 py-3 font-medium">{a.action}</td>
                      <td className="px-6 py-3 text-muted-foreground">{a.actor || 'system'}</td>
                      <td className="px-6 py-3 text-muted-foreground truncate max-w-xs">{a.target_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal
        open={!!roleModal}
        onClose={() => setRoleModal(null)}
        title="Change role"
        description={roleModal ? `For ${roleModal.email}` : ''}
        footer={
          <>
            <Button variant="outline" onClick={() => setRoleModal(null)}>Cancel</Button>
            <Button onClick={onSaveRole}>Save</Button>
          </>
        }
      >
        <Select value={roleValue} onChange={e => setRoleValue(e.target.value)} className="w-full">
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </Select>
      </Modal>
    </div>
  )
}

function Stat({ label, value, icon: Icon, tone = 'default' }) {
  const tones = { default: '', primary: 'text-primary', warning: 'text-amber-500', success: 'text-emerald-500', danger: 'text-red-500' }
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide">
        <Icon size={12} />{label}
      </div>
      <div className={`mt-1.5 font-display text-2xl font-semibold ${tones[tone]}`}>{value}</div>
    </div>
  )
}
