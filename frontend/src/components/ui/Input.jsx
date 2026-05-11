import { cn } from '@/lib/utils'

export function Input({ className, ...p }) {
  return <input className={cn('input', className)} {...p} />
}

export function Textarea({ className, ...p }) {
  return <textarea className={cn('input min-h-[80px]', className)} {...p} />
}

export function Select({ className, children, ...p }) {
  return <select className={cn('input pr-8', className)} {...p}>{children}</select>
}

export function Label({ className, ...p }) {
  return <label className={cn('text-sm font-medium text-foreground/90', className)} {...p} />
}

export function Field({ label, htmlFor, error, hint, children, className }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
