import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Wallet, Receipt, User, FileBarChart, Shield, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUserMode } from '@/contexts/UserModeContext'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

function buildNav(mode, hasRole) {
  if (mode === 'personal') {
    return [
      { to: '/personal', icon: LayoutDashboard, label: 'Overview' },
      { to: '/expenses', icon: Receipt, label: 'Expenses' },
      { to: '/reports', icon: FileBarChart, label: 'Reports' },
    ]
  }
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

export function MobileSidebar({ open, onClose }) {
  const { hasRole } = useAuth()
  const { mode } = useUserMode()
  const allItems = buildNav(mode, hasRole)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />
          <motion.aside
            key="drawer"
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-card border-r border-border flex flex-col"
          >
            <div className="px-5 h-16 flex items-center justify-between border-b border-border">
              <Logo />
              <button onClick={onClose} className="btn-ghost p-2 rounded-xl" aria-label="Close menu"><X size={18} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {allItems.map(it => (
                <NavLink
                  key={it.to}
                  to={it.to}
                  end
                  onClick={onClose}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )}
                >
                  <it.icon size={18} />
                  <span className="flex-1">{it.label}</span>
                  {it.soon && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">soon</span>}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
