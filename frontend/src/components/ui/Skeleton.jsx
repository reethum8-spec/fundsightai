import { cn } from '@/lib/utils'

export function Skeleton({ className, ...p }) {
  return <div className={cn('skeleton', className)} {...p} />
}
