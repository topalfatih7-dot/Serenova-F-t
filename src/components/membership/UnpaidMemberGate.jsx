import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Crown } from 'lucide-react'

/**
 * Ücretsiz üye — sayfa gezinilir; ücretli özellik yerine boş state + Plan seç CTA.
 * Eski tam sayfa duvarı yerine soft-lock olarak kullanılır.
 */
export default function UnpaidMemberGate({
  title = 'Bu özellik paket gerektirir',
  description = 'Sayfayı gezebilirsiniz; mesaj, randevu, program ve benzeri ücretli işlemler için bir plan seçin.',
  className = '',
}) {
  return (
    <div className={`flex min-h-[40vh] items-center justify-center py-8 ${className}`.trim()}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-lg"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100">
          <Crown className="h-7 w-7 text-amber-500" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-cream-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-cream-800/65">{description}</p>
        <Link
          to="/plans"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Crown className="h-4 w-4" /> Plan Seç
        </Link>
      </motion.div>
    </div>
  )
}
