import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { MobileSidebar } from './MobileSidebar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { Bell, Menu, Search } from 'lucide-react'
import { Logo } from '@/components/Logo'

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/70 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden btn-ghost p-2 rounded-xl"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>
          <div className="lg:hidden"><Link to="/"><Logo /></Link></div>
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search funds, expenses, anomalies…"
                className="input pl-9"
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="btn-ghost p-2 rounded-xl" aria-label="Notifications"><Bell size={18} /></button>
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 ml-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-white text-xs font-semibold flex items-center justify-center">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="text-sm">
                <div className="font-medium leading-none">{user?.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
            </div>
            <button className="btn-outline ml-2" onClick={logout}>Sign out</button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
