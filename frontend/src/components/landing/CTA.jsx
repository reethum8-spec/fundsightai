import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-card to-accent/10 p-10 md:p-14 text-center">
        <div className="blob bg-primary/30 w-[300px] h-[300px] -top-20 -left-10" />
        <div className="blob bg-accent/30 w-[300px] h-[300px] -bottom-20 -right-10" />
        <h3 className="relative font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          Ready to make every dollar accountable?
        </h3>
        <p className="relative mt-3 text-muted-foreground max-w-xl mx-auto">
          Join the private beta. Set up in minutes — no credit card required.
        </p>
        <div className="relative mt-7 flex justify-center gap-3">
          <Link to="/signup"><Button className="px-6 py-3">Get started <ArrowRight size={16} /></Button></Link>
          <a href="#features" className="btn-outline px-5 py-3">Explore features</a>
        </div>
      </div>
    </section>
  )
}
