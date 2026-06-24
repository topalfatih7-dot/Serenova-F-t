import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Crown, Star, Award, Sparkles, ArrowRight, Leaf, Dumbbell } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, formatMonthlyPrice, sortPlansForDisplay } from '../data/membershipPlans'

const comparisonRows = [
  { feature: 'Kişisel Sağlık & Vücut Analizi', free: true, eko: false, diyet: true, spor: true, kurucu: true, vip: true },
  { feature: 'Manuel Kalori Hesaplama', free: false, eko: true, diyet: true, spor: true, kurucu: true, vip: true },
  { feature: 'Fotoğraflı Kalori Tespiti', free: false, eko: false, diyet: true, spor: true, kurucu: true, vip: true },
  { feature: 'Diyetisyen Görüşmesi / Ay', free: false, eko: false, diyet: '2', spor: false, kurucu: '2', vip: '2' },
  { feature: 'Koç Görüşmesi / Ay', free: false, eko: false, diyet: false, spor: '2', kurucu: '2', vip: '2' },
  { feature: 'Diyet Programı', free: 'Otomatik', eko: 'Ayda 2', diyet: 'Özel', spor: false, kurucu: 'Özel', vip: 'Özel' },
  { feature: 'Spor Programı', free: 'Otomatik', eko: 'Ayda 1', diyet: false, spor: 'Özel', kurucu: 'Özel', vip: 'Özel' },
  { feature: 'Video Kütüphanesi', free: 'Temel', eko: 'Sınırlı', diyet: false, spor: 'Sınırsız', kurucu: 'Sınırsız', vip: 'Sınırsız' },
  { feature: 'İlerleme Raporları', free: 'Temel', eko: true, diyet: 'Sınırsız', spor: 'Sınırsız', kurucu: 'Sınırsız', vip: 'Sınırsız' },
  { feature: 'Destek', free: 'Standart', eko: 'Standart', diyet: 'Sınırsız', spor: 'Sınırsız', kurucu: 'Öncelikli', vip: 'Sınırsız' },
]

function PlanIcon({ id }) {
  if (id === 'free') return <Sparkles className="h-4 w-4 text-sage-500" />
  if (id === 'eko') return <Leaf className="h-4 w-4 text-sage-500" />
  if (id === 'diyet') return <Sparkles className="h-4 w-4 text-emerald-500" />
  if (id === 'spor') return <Dumbbell className="h-4 w-4 text-blue-500" />
  if (id === 'kurucu') return <Crown className="h-4 w-4 text-amber-500" />
  if (id === 'vip') return <Award className="h-4 w-4 text-brand-500" />
  return null
}

function planHeaderColor(id) {
  if (id === 'kurucu') return 'text-amber-700'
  if (id === 'vip') return 'text-brand-700'
  if (id === 'spor') return 'text-blue-700'
  if (id === 'diyet') return 'text-emerald-700'
  if (id === 'eko') return 'text-sage-700'
  return 'text-sage-700'
}

function CellValue({ value }) {
  if (value === false) return <X className="mx-auto h-4 w-4 text-cream-300" />
  if (value === true) return <Check className="mx-auto h-4 w-4 text-sage-500" />
  return <span className="text-xs font-medium text-cream-800">{value}</span>
}

export default function MembershipComparisonPage() {
  const { plans, isAuthenticated, isAdmin, isStaff, membership } = useApp()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const isMember = isAuthenticated && !isAdmin && !isStaff
  const displayPlans = isMember ? allPlans.filter((p) => p.id !== membership) : allPlans

  return (
    <div className="section-trust mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <span className="section-badge">Karşılaştır</span>
        <h1 className="section-title mt-4 sm:text-4xl">Üyelik Karşılaştırması</h1>
        <p className="section-subtitle">
          {isMember ? 'Mevcut planınız hariç diğer seçenekleri inceleyin' : 'Tüm planları yan yana inceleyin'}
        </p>
        <p className="mt-2 text-sm text-cream-800/55">Tüm ücretli paketlerde 1, 3 veya 6 aylık süre seçenekleri mevcuttur.</p>
      </div>

      <div className="mt-12 overflow-x-auto rounded-2xl border border-cream-100 bg-white shadow-sm">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-cream-100 bg-gradient-to-r from-cream-50 to-white">
              <th className="py-4 pl-5 pr-4 text-left text-sm font-medium text-cream-800/50 w-48">Özellik</th>
              {displayPlans.map((plan) => (
                <th key={plan.id} className="px-3 py-4 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream-50 ring-1 ring-cream-100">
                      <PlanIcon id={plan.id} />
                    </span>
                    <span className={`font-display font-bold ${planHeaderColor(plan.id)}`}>{plan.name}</span>
                    <span className="text-xs font-medium text-cream-800/50">
                      {plan.price === 0 ? 'Ücretsiz' : formatMonthlyPrice(plan.price)}
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

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayPlans.filter((p) => p.id !== 'free').map((plan) => (
          <Link
            key={plan.id}
            to={`/onboarding?plan=${plan.id}`}
            className={`flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold transition ${
              plan.id === 'kurucu'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:from-amber-600 hover:to-amber-700'
                : plan.id === 'vip'
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md hover:from-brand-600 hover:to-brand-700'
                  : 'border border-cream-200 bg-cream-50 text-cream-900 hover:bg-cream-100'
            }`}
          >
            {plan.name} Seç
            <ArrowRight className="h-4 w-4" />
          </Link>
        ))}
      </div>
    </div>
  )
}
