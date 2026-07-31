import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle, Crown, PartyPopper } from 'lucide-react'
import { BRAND } from '../../config/brand'

export default function WelcomeSuccessModal({ open, planName, isPaid, onContinue }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-success-title"
            initial={{ opacity: 0, scale: 0.82, y: 32 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="fixed inset-x-4 top-1/2 z-[210] mx-auto max-w-lg -translate-y-1/2 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            {isPaid ? (
              <>
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-brand-600 to-sage-600 px-6 py-12 text-center text-white">
                  <motion.div
                    aria-hidden
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity }}
                    className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/20 blur-2xl"
                  />
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.15, stiffness: 320, damping: 18 }}
                    className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-black/20"
                  >
                    <CheckCircle className="h-11 w-11 text-emerald-500" strokeWidth={2.5} />
                  </motion.div>
                  <motion.h2
                    id="welcome-success-title"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="relative mt-6 font-display text-3xl font-bold tracking-tight"
                  >
                    Ödemeniz Başarılı!
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="relative mt-2 text-base text-white/90"
                  >
                    {planName ? `${planName} üyeliğiniz aktif edildi.` : 'Üyeliğiniz aktif edildi.'}
                  </motion.p>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.55 }}
                    className="relative mt-4 text-sm text-white/80"
                  >
                    {BRAND.name}&apos;i tercih ettiğiniz için teşekkür ederiz.
                  </motion.p>
                </div>
              </>
            ) : (
              <div className="relative bg-gradient-to-br from-brand-500 via-brand-600 to-sage-600 px-6 py-10 text-center text-white">
                <motion.div
                  animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.06, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2 }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur"
                >
                  <PartyPopper className="h-8 w-8" />
                </motion.div>
                <h2 id="welcome-success-title" className="mt-5 font-display text-2xl font-bold">Hoş geldiniz!</h2>
                <p className="mt-2 text-sm text-white/85">
                  {BRAND.name}&apos;i tercih ettiğiniz için teşekkür ederiz.
                </p>
              </div>
            )}

            <div className="space-y-4 px-6 py-6">
              <div className="flex items-start gap-3 rounded-2xl border border-cream-100 bg-cream-50/80 p-4">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                <p className="text-sm leading-relaxed text-cream-800/80">
                  {isPaid
                    ? 'Hesabınız hazır. Kişisel panelinizden programlarınızı takip edebilir, uzmanlarınızla iletişime geçebilir ve hedeflerinize adım adım ilerleyebilirsiniz.'
                    : 'Hesabınız hazır. Panelinizden programları, takvimi ve içerikleri keşfedebilirsiniz; bir paket seçerek tüm hizmetleri açabilirsiniz.'}
                </p>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onContinue?.()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-sage-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25"
              >
                {isPaid && <Crown className="h-4 w-4 text-gold-200" />}
                {isPaid ? 'Panele Git' : 'Panele Başla'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
