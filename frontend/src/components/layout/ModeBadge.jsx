import { useNavigate } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { useUserMode, MODE_META } from '@/contexts/UserModeContext'

/** Small workspace card shown at the bottom of the sidebar. Tap → /welcome. */
export function ModeBadge() {
  const { mode, reset } = useUserMode()
  const nav = useNavigate()
  const meta = MODE_META[mode]
  if (!meta) return null

  const onSwitch = () => {
    reset()
    nav('/welcome')
  }

  return (
    <button
      type="button"
      onClick={onSwitch}
      className={`group m-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary/40 hover:shadow-lg bg-gradient-to-br ${meta.accent}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
        <Repeat size={12} className="text-muted-foreground group-hover:text-primary transition" />
      </div>
      <p className="mt-1 text-sm font-semibold">{meta.label}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{meta.tagline}</p>
    </button>
  )
}
