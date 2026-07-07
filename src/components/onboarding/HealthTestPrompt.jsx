import { motion } from 'framer-motion'
import { HeartPulse, Sparkles, Clock, ArrowRight, X } from 'lucide-react'

export default function HealthTestPrompt({ open, onStart, onLater, onClose }) {
  if (!open) return null

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-black/55 backdrop-blur-sm"
      />
      <motion.div
        layoutId="health-test-prompt"
        initial={{ opacity: 0, scale: 0.92, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.85, y: 40 }}
        transition={{ type: 'spring', damping: 24, stiffness: 320 }}
        className="fixed inset-x-4 top-1/2 z-[111] mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-sage-600 px-6 pb-8 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full bg-white/20 p-1.5 text-white transition hover:bg-white/30"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
          <motion.div
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
          >
            <HeartPulse className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="mt-4 text-center font-display text-2xl font-bold text-white">
            Sağlık profilinizi tanıyalım
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-white/85">
            Kategorilere ayrılmış kısa testlerle ruh halinizi, beslenmenizi ve sağlık geçmişinizi adım adım paylaşın.
          </p>
        </div>

        <div className="space-y-3 p-6">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-cream-800/75">
            <span className="flex items-center gap-2 font-semibold text-brand-700">
              <Sparkles className="h-4 w-4" /> Kategorilere bölünmüş testler
            </span>
            <p className="mt-1 text-xs leading-relaxed">
              İstediğiniz kategoriden başlayın; her biri birkaç dakika sürer.
            </p>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/25"
          >
            Testi Şimdi Çöz
            <ArrowRight className="h-4 w-4" />
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLater}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-cream-50 py-3.5 text-sm font-semibold text-cream-800 transition hover:bg-cream-100"
          >
            <Clock className="h-4 w-4 text-cream-800/50" />
            Sonra Hatırlat
          </motion.button>
        </div>
      </motion.div>
    </>
  )
}
