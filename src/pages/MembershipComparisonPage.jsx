import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, Star, Award, Sparkles, ArrowRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS } from '../data/membershipPlans'

const comparisonRows = [
  { feature: 'YZ Profil & Vücut Analizi', free: true, gumus: true, altin: true, platinum: true },
  { feature: 'Video Kütüphanesi', free: 'Temel', gumus: 'Tam Erişim', altin: 'Tam Erişim', platinum: 'Tam Erişim' },
  { feature: 'Koç Görüşmesi / Hafta', free: false, gumus: '1', altin: '2', platinum: '3' },
  { feature: 'Diyetisyen / Ay', free: false, gumus: '1', altin: '2', platinum: '4 (Haftada 1)' },
  { feature: 'Kişisel Program', free: false, gumus: false, altin: true, platinum: true },
  { feature: 'Grup Seansları', free: false, gumus: false, altin: true, platinum: true },
  { feature: 'İlerleme Raporları', free: false, gumus: 'Temel', altin: 'Detaylı', platinum: 'Detaylı' },
  { feature: 'Destek', free: 'Standart', gumus: 'E-posta', altin: 'Öncelikli', platinum: '7/24 VIP' },
  { feature: 'Mental Wellness Seansları', free: false, gumus: false, altin: false, platinum: true },
  { feature: 'Özel Aktiviteler', free: false, gumus: false, altin: false, platinum: true },
]

function PlanIcon({ id }) {
  if (id === 'free')     return <Sparkles className="h-4 w-4 text-sage-500" />
  if (id === 'gumus')    return <Star className="h-4 w-4 text-slate-400" />
  if (id === 'altin')    return <Crown className="h-4 w-4 text-amber-500" />
  if (id === 'platinum') return <Award className="h-4 w-4 text-brand-500" />
  return null
}

function planHeaderColor(id) {
  if (id === 'altin')    return 'text-amber-700'
  if (id === 'platinum') return 'text-brand-700'
  if (id === 'gumus')    return 'text-slate-600'
  return 'text-sage-700'
}

function CellValue({ value }) {
  if (value === false) return <X className="mx-auto h-4 w-4 text-cream-300" />
  if (value === true)  return <Check className="mx-auto h-4 w-4 text-sage-500" />
  return <span className="text-xs font-medium text-cream-800">{value}</span>
}

export default function MembershipComparisonPage() {
  const { plans } = useApp()
  const displayPlans = plans?.length ? plans : ALL_PLANS

  return (
    <div className="section-trust mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="section-badge">Karşılaştır</span>
        <h1 className="section-title mt-4 sm:text-4xl">Üyelik Karşılaştırması</h1>
        <p className="section-subtitle">Tüm planları yan yana inceleyin</p>
      </div>

      <div className="mt-12 overflow-x-auto rounded-2xl border border-cream-100 bg-white shadow-sm">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="border-b border-cream-100 bg-gradient-to-r from-cream-50 to-white">
              <th className="py-4 pl-5 pr-4 text-left text-sm font-medium text-cream-800/50 w-48">Özellik</th>
              {displayPlans.map((plan) => (
                <th key={plan.id} className="px-3 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <PlanIcon id={plan.id} />
                      <span className={`font-display font-bold ${planHeaderColor(plan.id)}`}>{plan.name}</span>
                    </div>
                    <span className="text-xs text-cream-800/50">
                      {plan.price === 0 ? 'Ücretsiz' : `${plan.price?.toLocaleString('tr-TR')}₺/ay`}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, i) => (
              <motion.tr
                key={row.feature}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                viewport={{ once: true }}
                className="border-b border-cream-50 hover:bg-cream-50/50 transition"
              >
                <td className="py-3.5 pl-5 pr-4 text-sm font-medium text-cream-900">{row.feature}</td>
                {displayPlans.map((plan) => (
                  <td key={plan.id} className="px-3 py-3.5 text-center text-sm">
                    <CellValue value={row[plan.id]} />
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {displayPlans.map((plan) => (
          <Link
            key={plan.id}
            to={`/onboarding?plan=${plan.id}`}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition ${
              plan.id === 'altin'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:from-amber-600 hover:to-amber-700'
                : plan.id === 'platinum'
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md hover:from-brand-600 hover:to-brand-700'
                  : plan.id === 'gumus'
                    ? 'border-2 border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    : 'border border-cream-200 bg-cream-50 text-cream-900 hover:bg-cream-100'
            }`}
          >
            {plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} Seç`}
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  )
}
