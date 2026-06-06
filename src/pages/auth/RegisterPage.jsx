import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg text-center">
        <h1 className="font-display text-3xl font-bold text-cream-900">Dönüşüm yolculuğunuza başlayın</h1>
        <p className="mt-3 text-cream-800/60">
          Birkaç dakikada profilinizi oluşturun ve size uygun planı seçin.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/onboarding"
            className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <p className="font-semibold text-cream-900">Yeni Kayıt</p>
            <p className="mt-2 text-sm text-cream-800/60">Adım adım onboarding ile başlayın</p>
          </Link>
          <Link
            to="/login"
            className="rounded-2xl border border-cream-200 bg-cream-50 p-6 transition hover:bg-cream-100"
          >
            <p className="font-semibold text-cream-900">Zaten üyeyim</p>
            <p className="mt-2 text-sm text-cream-800/60">Hesabınıza giriş yapın</p>
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
