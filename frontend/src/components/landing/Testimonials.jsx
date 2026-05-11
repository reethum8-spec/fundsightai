const items = [
  { name: 'Aisha Rahman', role: 'CFO, BrightFutures NGO', quote: 'FundSight cut our reporting time by 70%. Our donors now see real-time impact dashboards.' },
  { name: 'Daniel Kim', role: 'Founder, OrbitLabs', quote: 'We caught two anomalous transactions in week one. The ML detection is uncannily accurate.' },
  { name: 'Priya Menon', role: 'Personal user', quote: 'It feels like a financial advisor in my pocket — and the dashboard is gorgeous.' },
]

export function Testimonials() {
  return (
    <section id="testimonials" className="mx-auto max-w-7xl px-6 py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-primary">Loved by teams & individuals</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          Trusted across NGOs, startups, and households
        </h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {items.map(t => (
          <figure key={t.name} className="glass-card p-6">
            <blockquote className="text-sm leading-relaxed">“{t.quote}”</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-sm">
                {t.name.split(' ').map(s => s[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div className="text-sm font-medium">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
