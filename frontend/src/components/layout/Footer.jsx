import { Logo } from '@/components/Logo'

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="mx-auto max-w-7xl px-6 py-12 grid gap-8 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            AI-powered fund utilization & financial intelligence for organizations and individuals.
          </p>
        </div>
        {[
          { title: 'Product', items: ['Features', 'Integrations', 'Changelog'] },
          { title: 'Company', items: ['About', 'Customers', 'Careers', 'Contact'] },
          { title: 'Resources', items: ['Documentation', 'API', 'Security', 'Status'] },
        ].map(col => (
          <div key={col.title}>
            <h4 className="font-semibold mb-3 text-sm">{col.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {col.items.map(i => <li key={i}><a href="#" className="hover:text-foreground transition">{i}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} FundSight AI · Built for transparent, intelligent finance.
      </div>
    </footer>
  )
}
