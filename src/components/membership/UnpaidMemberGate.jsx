import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AlertTriangle, Crown } from 'lucide-react'

/** Dashboard / panel sayfaları — paketsiz üye tam duvarı. */
export default function UnpaidMemberGate() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-xl"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
          <Crown className="h-8 w-8 text-amber-500" />
        </div>
        <h2 className="mt-5 font-display text-xl font-bold text-cream-900">Aktif paketiniz yok</h2>
        <p className="mt-2 text-sm leading-relaxed text-cream-800/65">
          Panel özelliklerine devam etmek için bir üyelik planı seçin. Paket süreniz dolduysa yenileyerek erişimi yeniden açabilirsiniz.
        </p>
        <Link
          to="/membership"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          <Crown className="h-4 w-4" /> Plan Seç &amp; Devam Et
        </Link>
        <p className="mt-4 text-xs text-cream-800/40">
          Soru ve sorunlar için <Link to="/support" className="underline">destek merkezi</Link>
        </p>
      </motion.div>
    </div>
  )
}

/** Profil — satır içi uyarı (profil erişilebilir kalır). */
export function UnpaidMemberProfileAlert() {
  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border-2 border-red-500 bg-red-50 px-4 py-4 shadow-sm ring-2 ring-red-200/80 sm:px-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow">
            <AlertTriangle className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-extrabold uppercase tracking-wide text-red-700">
              Dikkat — aktif paket yok
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-red-800">
              Panel özelliklerine devam etmek için bir plan seçin veya mevcut paketini yenileyin.
            </p>
          </div>
        </div>
        <Link
          to="/membership"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow hover:bg-red-700"
        >
          <Crown className="h-4 w-4" /> Plan Seç
        </Link>
      </div>
    </motion.div>
  )
}
