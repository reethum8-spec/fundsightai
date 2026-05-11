import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Wraps a route. Redirects to /login if not authenticated.
 * Optionally restricts to a list of roles via the `roles` prop.
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, loading, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          Loading…
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && roles.length && !hasRole(roles)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}
