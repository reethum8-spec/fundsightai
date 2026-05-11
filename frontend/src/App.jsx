import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import AuthCallback from './pages/AuthCallback.jsx'
import Welcome from './pages/Welcome.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './routes/ProtectedRoute.jsx'
import ModeGate from './routes/ModeGate.jsx'
import DashboardLayout from './components/layout/DashboardLayout.jsx'

/* Heavy pages are lazy-loaded to keep the initial bundle small. */
const Funds = lazy(() => import('./pages/Funds.jsx'))
const Expenses = lazy(() => import('./pages/Expenses.jsx'))
const PersonalFinance = lazy(() => import('./pages/PersonalFinance.jsx'))
const Reports = lazy(() => import('./pages/Reports.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="w-5 h-5 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        Loading…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/welcome"
          element={
            <ProtectedRoute>
              <Welcome />
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <ModeGate>
                <DashboardLayout />
              </ModeGate>
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/funds" element={<Funds />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/personal" element={<PersonalFinance />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
        <Route
          element={
            <ProtectedRoute roles={['org_admin', 'super_admin']}>
              <ModeGate>
                <DashboardLayout />
              </ModeGate>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<Admin />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}
