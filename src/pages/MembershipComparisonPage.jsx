import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, ArrowRight } from 'lucide-react'
import { PREMIUM_PLAN } from '../data/membershipPlans'

const comparisonRows = [
  { feature: 'Haftalık antrenman planı', free: '1 genel plan', premium: 'Kişiye özel plan' },
  { feature: 'Koç görüşmesi', free: false, premium: 'Haftada 2 (özelleştirilebilir)' },
  { feature: 'Diyetisyen görüşmesi', free: false, premium: 'Ayda 1 (özelleştirilebilir)' },
  { feature: 'Takvim takibi', free: 'Temel', premium: 'Detaylı' },
  { feature: 'Hatırlatıcılar', free: 'Sınırlı', premium: 'Kişiselleştirilmiş' },
  { feature: 'İlerleme raporları', free: false, premium: true },
  { feature: 'Öncelikli destek', free: false, premium: true },
  { feature: 'Eklenti seçenekleri', free: false, premium: true },
  { feature: 'Topluluk erişimi', free: 'Sınırlı', premium: 'Tam erişim' },
]

export default function MembershipComparisonPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-cream-900 sm:text-4xl">Üyelik Karşılaştırması</h1>
        <p className="mt-3 text-cream-800/60">Size en uygun planı seçin</p>
      </div>

      <div className="mt-12 overflow-hidden rounded-3xl border border-cream-200 bg-white shadow-sm">
        <div className="grid grid-cols-3 border-b border-cream-100 bg-cream-50 p-4 sm:p-6">
          <div className="text-sm font-medium text-cream-800/60">Özellik</div>
          <div className="text-center font-semibold text-cream-900">Ücretsiz</div>
          <div className="flex items-center justify-center gap-1 font-semibold text-brand-600">
            <Crown className="h-4 w-4 text-gold-500" /> Premium
          </div>
        </div>
        {comparisonRows.map((row, i) => (
          <motion.div
            key={row.feature}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: i * 0.03 }}
            viewport={{ once: true }}
            className="grid grid-cols-3 border-b border-cream-50 p-4 sm:p-5"
          >
            <div className="text-sm text-cream-900">{row.feature}</div>
            <div className="text-center text-sm">
              {row.free === false ? <X className="mx-auto h-4 w-4 text-cream-300" /> : row.free === true ? <Check className="mx-auto h-4 w-4 text-sage-500" /> : <span className="text-cream-800/60">{row.free}</span>}
            </div>
            <div className="text-center text-sm">
              {row.premium === false ? <X className="mx-auto h-4 w-4 text-cream-300" /> : row.premium === true ? <Check className="mx-auto h-4 w-4 text-sage-500" /> : <span className="font-medium text-brand-700">{row.premium}</span>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link to="/register" className="flex items-center justify-center gap-2 rounded-2xl border border-cream-200 bg-cream-50 py-4 text-sm font-semibold hover:bg-cream-100">
          Ücretsiz Başla
        </Link>
        <Link to="/builder" className="flex items-center justify-center gap-2 rounded-2xl bg-brand-500 py-4 text-sm font-semibold text-white hover:bg-brand-600">
          Premium Paket Oluştur <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand-50 to-sage-50 p-6 text-center sm:p-8">
        <h2 className="font-display text-xl font-bold text-cream-900">Premium ile neler kazanırsınız?</h2>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PREMIUM_PLAN.benefits.map((b) => (
            <span key={b} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm">
              {b}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
