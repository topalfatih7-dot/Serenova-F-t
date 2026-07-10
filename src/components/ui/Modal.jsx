import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, size = 'md', zClass = 'z-50' }) {
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <AnimatePresence>
      {open && (
        <div className={`fixed inset-0 ${zClass} flex items-end justify-center p-3 sm:items-center sm:p-4`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-cream-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative flex max-h-[min(92dvh,calc(100vh-1.5rem))] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-xl sm:max-h-[min(90dvh,calc(100vh-2rem))] ${sizes[size]}`}
          >
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cream-100 px-4 py-3.5 sm:px-6 sm:py-4">
              {title ? (
                <h3 className="min-w-0 flex-1 font-display text-base font-semibold text-cream-900 sm:text-lg">{title}</h3>
              ) : (
                <span className="flex-1" />
              )}
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg p-1.5 text-cream-800/50 hover:bg-cream-100 hover:text-cream-900"
                aria-label="Kapat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5" data-scroll-lock>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
