import { cn } from '@/lib/utils'

const variants = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
}

export function Button({ className, variant = 'primary', as: As = 'button', ...props }) {
  return <As className={cn(variants[variant] || variants.primary, className)} {...props} />
}
