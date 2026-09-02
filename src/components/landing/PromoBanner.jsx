import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, ArrowRight, CreditCard } from 'lucide-react'

const STORAGE_KEY = 'yf_promo_banner_dismissed'

function readVisible() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1'
  } catch {
    return true
  }
}

export default function PromoBanner() {
  const [visible, setVisible] = useState(readVisible)

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch { /* ignore */ }
  }

  return (
    <AnimatePresence>
      {visible && (
        // height:'auto' kaldırıldı — layout recalculation (reflow) tetiklerdi.
        // Sadece opacity + translateY kullanılır; compositor katmanında çalışır.
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden border-b border-brand-700/20 bg-gradient-to-r from-brand-700 via-brand-600 to-sage-600 text-white"
        >
          <div
            aria-hidden
            className="promo-shimmer pointer-events-none absolute inset-0 opacity-30"
          />
          <motion.div
            aria-hidden
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
            className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12"
          />

          <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
              <motion.span
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="hidden shrink-0 sm:flex"
              >
                <Sparkles className="h-4 w-4 text-gold-300" />
              </motion.span>
              <p className="truncate text-xs font-medium sm:text-sm">
                <span className="font-semibold">Paketini seç</span>
                <span className="mx-1.5 hidden text-white/50 sm:inline">·</span>
                <span className="hidden text-white/90 sm:inline">Diyet, Spor veya VIP</span>
                <CreditCard className="ml-1 inline h-3.5 w-3.5 text-white/70 sm:hidden" />
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Link
                to="/membership"
                className="group inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/25 sm:px-4 sm:text-sm"
              >
                Hemen Başla
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Banner'ı kapat"
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/15 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
