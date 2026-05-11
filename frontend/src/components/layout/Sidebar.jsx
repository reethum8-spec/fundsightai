import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Wallet, Receipt, User, FileBarChart, Shield,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useUserMode } from '@/contexts/UserModeContext'
import { ModeBadge } from './ModeBadge'

/** Build navigation tailored to the active workspace mode. */
function buildNav(mode, hasRole) {
  if (mode === 'personal') {
    return [
      { to: '/personal', icon: LayoutDashboard, label: 'Overview' },
      { to: '/expenses', icon: Receipt, label: 'Expenses' },
      { to: '/reports', icon: FileBarChart, label: 'Reports' },
    ]
  }

  // Business + Institution share the same nav, just labels differ slightly.
  const fundsLabel = mode === 'business' ? 'Departments' : 'Funds'
  const items = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { to: '/funds', icon: Wallet, label: fundsLabel },
    { to: '/expenses', icon: Receipt, label: 'Expenses' },
    { to: '/personal', icon: User, label: 'Personal' },
    { to: '/reports', icon: FileBarChart, label: 'Reports' },
  ]
  if (hasRole('org_admin', 'super_admin')) {
    items.push({ to: '/admin', icon: Shield, label: 'Admin' })
  }
  return items
}

export function Sidebar() {
  const { hasRole } = useAuth()
  const { mode } = useUserMode()
  const items = buildNav(mode, hasRole)

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/50 backdrop-blur">
      <div className="px-5 h-16 flex items-center border-b border-border"><Logo /></div>
      <nav className="flex-1 p-3 space-y-1">
        {items.map(it => (
          <NavLink
            key={it.to}
            to={it.to}
            end
            className={({ isActive }) => cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <it.icon size={18} />
            <span className="flex-1">{it.label}</span>
          </NavLink>
        ))}
      </nav>
      <ModeBadge />
    </aside>
  )
}
