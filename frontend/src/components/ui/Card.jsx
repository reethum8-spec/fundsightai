import { cn } from '@/lib/utils'

export function Card({ className, glass = false, ...props }) {
  return <div className={cn(glass ? 'glass-card' : 'card', className)} {...props} />
}
export function CardHeader({ className, ...p }) {
  return <div className={cn('px-6 pt-6', className)} {...p} />
}
export function CardTitle({ className, ...p }) {
  return <h3 className={cn('font-display text-lg font-semibold tracking-tight', className)} {...p} />
}
export function CardDescription({ className, ...p }) {
  return <p className={cn('text-sm text-muted-foreground mt-1', className)} {...p} />
}
export function CardContent({ className, ...p }) {
  return <div className={cn('p-6', className)} {...p} />
}
