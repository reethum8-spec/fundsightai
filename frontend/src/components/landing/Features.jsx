import { motion } from 'framer-motion'
import { Brain, ShieldAlert, LineChart, Wallet, Layers, Sparkles } from 'lucide-react'

const features = [
  { icon: Brain, title: 'AI Anomaly Detection', body: 'Isolation Forest models flag suspicious transactions in real time across categories and projects.' },
  { icon: LineChart, title: 'Predictive Overruns', body: 'Random Forest forecasts budget overruns weeks before they happen — with explainable drivers.' },
  { icon: ShieldAlert, title: 'Misuse Probability', body: 'Hybrid score blends anomaly + behavioral signals to surface high-risk spending instantly.' },
  { icon: Layers, title: 'Impact-to-Spend Ratio', body: 'Outcome-weighted analytics tie every dollar to measurable beneficiary impact.' },
  { icon: Wallet, title: 'Personal + Institutional', body: 'One platform for NGOs, startups, businesses, and individual finance — unified data model.' },
  { icon: Sparkles, title: 'AI Financial Coach', body: 'Personalized recommendations, savings nudges, and category-level insights every week.' },
]

export function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-24">
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-sm font-medium text-primary">Capabilities</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl font-semibold tracking-tight">
          Built for transparent, intelligent finance
        </h2>
        <p className="mt-3 text-muted-foreground">
          Six patent-style intelligence systems working together — from allocation to impact.
        </p>
      </div>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className="glass-card p-6 group hover:-translate-y-0.5 transition"
          >
            <div className="inline-flex p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
              <f.icon size={20} />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
