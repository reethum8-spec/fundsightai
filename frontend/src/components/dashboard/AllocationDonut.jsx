import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const COLORS = ['#7c3aed', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#6366f1']

export function AllocationDonut({ data }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <div className="relative h-72">
      <ResponsiveContainer>
        <PieChart>
          <Tooltip
            contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
            formatter={(v, n) => [`$${Number(v).toLocaleString()}`, n]}
          />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={64} outerRadius={96} paddingAngle={3} stroke="none">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-xs text-muted-foreground">Total</div>
        <div className="font-display text-xl font-semibold">${(total / 1000).toFixed(0)}k</div>
      </div>
    </div>
  )
}
