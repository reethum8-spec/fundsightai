import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const ToastContext = createContext(null)

const ICONS = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}
const COLORS = {
  success: 'text-emerald-500 bg-emerald-500/10',
  error: 'text-red-500 bg-red-500/10',
  info: 'text-cyan-500 bg-cyan-500/10',
}

export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setItems(list => list.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type, message, opts = {}) => {
    const id = ++idRef.current
    const item = { id, type, message, ...opts }
    setItems(list => [...list, item])
    const ttl = opts.ttl ?? 4500
    if (ttl > 0) setTimeout(() => dismiss(id), ttl)
    return id
  }, [dismiss])

  const value = {
    success: (m, o) => push('success', m, o),
    error:   (m, o) => push('error',   m, o),
    info:    (m, o) => push('info',    m, o),
    dismiss,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]">
        <AnimatePresence>
          {items.map(t => {
            const Icon = ICONS[t.type] || Info
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', stiffness: 360, damping: 30 }}
                className="pointer-events-auto glass-card p-3 flex items-start gap-3"
              >
                <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', COLORS[t.type])}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <div className="text-sm font-medium">{t.title}</div>}
                  <div className="text-sm text-muted-foreground break-words">{t.message}</div>
                </div>
                <button onClick={() => dismiss(t.id)} className="text-muted-foreground hover:text-foreground p-1" aria-label="Dismiss">
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
