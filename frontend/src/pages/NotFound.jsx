import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/Logo'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <Logo />
      <h1 className="mt-8 font-display text-6xl font-semibold gradient-text">404</h1>
      <p className="mt-3 text-muted-foreground">This page slipped through our ledger.</p>
      <Link to="/" className="mt-6"><Button>Back home</Button></Link>
    </div>
  )
}
