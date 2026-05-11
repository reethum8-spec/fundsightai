import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

export function Navbar() {
  const { user, logout } = useAuth()
  return (
    <header className="sticky top-0 z-40 w-full">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
        <div className="glass rounded-2xl px-4 py-2.5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            <a href="#features" className="btn-ghost">Features</a>
            <a href="#testimonials" className="btn-ghost">Customers</a>
            <NavLink to="/dashboard" className="btn-ghost">Dashboard</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span className="hidden sm:inline text-sm text-muted-foreground">{user.name}</span>
                <Button variant="outline" onClick={logout}>Sign out</Button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Sign in</Link>
                <Link to="/signup"><Button>Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
