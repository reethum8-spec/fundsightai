import { Navigate } from 'react-router-dom'
import { useUserMode } from '@/contexts/UserModeContext'

/**
 * Sends the user to /welcome until they pick a workspace mode.
 * Sits inside ProtectedRoute so we can assume the user is authenticated.
 */
export default function ModeGate({ children }) {
  const { mode } = useUserMode()
  if (!mode) return <Navigate to="/welcome" replace />
  return children
}
