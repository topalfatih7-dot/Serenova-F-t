import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const styles = {
  success: 'bg-sage-50 border-sage-400 text-sage-700',
  error: 'bg-red-50 border-red-300 text-red-700',
  warning: 'bg-amber-50 border-amber-300 text-amber-800',
  info: 'bg-brand-50 border-brand-300 text-brand-700',
}

let toastSeq = 0

function nextToastId() {
  toastSeq += 1
  return `toast-${toastSeq}-${Date.now().toString(36)}`
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const clearTimer = useCallback((id) => {
    const timer = timersRef.current.get(id)
    if (timer != null) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const dismiss = useCallback((id) => {
    clearTimer(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [clearTimer])

  const toast = useCallback((message, type = 'success', duration = 3500) => {
    const id = nextToastId()
    const safeType = styles[type] ? type : 'info'
    const ms = Number.isFinite(duration) && duration >= 0 ? duration : 3500
    setToasts((prev) => [...prev, { id, message, type: safeType }])
    if (ms > 0) {
      const timer = setTimeout(() => dismiss(id), ms)
      timersRef.current.set(id, timer)
    }
    return id
  }, [dismiss])

  useEffect(() => () => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
  }, [])

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-6 right-4 z-[500] flex flex-col gap-2 sm:right-6" style={{ pointerEvents: 'auto' }}>
        <AnimatePresence>
          {toasts.map((t) => {
            const Icon = icons[t.type] || Info
            return (
              <motion.div
                key={t.id}
                role="status"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.2 }}
                className={`flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg ${styles[t.type]}`}
                style={{ pointerEvents: 'auto' }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="flex-1 text-sm font-medium">{t.message}</span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); dismiss(t.id) }}
                  className="ml-1 shrink-0 rounded-md p-1 opacity-60 transition hover:bg-black/10 hover:opacity-100"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
