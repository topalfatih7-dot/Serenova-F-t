import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, HelpCircle, UserPlus, CreditCard, LayoutDashboard } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, formatMonthlyPrice, sortPlansForDisplay } from '../data/membershipPlans'
import MembershipHero from '../components/membership/MembershipHero'
import MembershipPlanCard from '../components/membership/MembershipPlanCard'
import MembershipReassurance from '../components/membership/MembershipReassurance'
import { getPlanTheme, planIcon } from '../components/membership/planTheme'

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

const HOW_IT_WORKS = [
  { icon: UserPlus, title: '1. Planınızı seçin', desc: 'Ücretsiz başlayın veya size uygun paketi seçin — taahhüt baskısı yok.' },
  { icon: CreditCard, title: '2. Güvenle kayıt olun', desc: 'Birkaç bilgi, şifre oluşturun. Ücretli planda güvenli ödeme ekranına geçersiniz.' },
  { icon: LayoutDashboard, title: '3. Hemen başlayın', desc: 'Dashboard\'ınız açılır; programlarınız ve uzman desteğiniz hazır.' },
]

function CellValue({ value }) {
  if (value === false) return <X className="mx-auto h-4 w-4 text-cream-300" />
  if (value === true) return <Check className="mx-auto h-4 w-4 text-sage-500" />
  return <span className="text-xs font-semibold text-cream-800">{value}</span>
}

export default function MembershipComparisonPage() {
  const { plans, isAuthenticated, isAdmin, isStaff, membership } = useApp()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const isMember = isAuthenticated && !isAdmin && !isStaff
  const displayPlans = isMember ? allPlans.filter((p) => p.id !== membership) : allPlans

  return (
    <div className="overflow-x-hidden bg-gradient-to-b from-cream-50/50 via-white to-sage-50/30">
      <MembershipHero
        title="Size en uygun planı seçin"
        subtitle={
          isMember
            ? 'Mevcut planınız hariç tüm seçenekleri karşılaştırın. Her adımda ne alacağınızı net şekilde görürsünüz.'
            : 'Ücretsiz başlayın veya uzman destekli paketlerden birini seçin. Gizli ücret yok, süre seçimi sizde.'
        }
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
        {/* Plan kartları */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {displayPlans.map((plan, i) => (
            <MembershipPlanCard
              key={plan.id}
              plan={plan}
              index={i}
              mode="link"
              ctaTo={isMember ? `/onboarding?plan=${plan.id}` : `/onboarding?plan=${plan.id}`}
              ctaLabel={plan.price === 0 ? 'Ücretsiz Başla' : `${plan.name} ile Kayıt Ol`}
            />
          ))}
        </div>

        {/* Nasıl üye olunur */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-14 rounded-3xl border border-sage-200/60 bg-gradient-to-br from-sage-50/80 via-white to-teal-50/50 p-6 sm:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
              <HelpCircle className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-cream-900">Nasıl üye olursunuz?</h2>
              <p className="mt-1 text-sm text-cream-800/65">Üç basit adım — kafanızda soru işareti kalmadan.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-sm"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-100 to-sage-100 text-brand-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-cream-900">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-cream-800/65">{step.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* Karşılaştırma tablosu */}
        <div className="mt-14 text-center">
          <span className="section-badge">Detaylı Karşılaştırma</span>
          <h2 className="section-title mt-4">Özellik özellik yan yana</h2>
          <p className="section-subtitle">Tüm planlarda 1, 3 veya 6 aylık süre seçenekleri mevcuttur.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 overflow-hidden rounded-3xl border border-cream-200/80 bg-white shadow-lg shadow-cream-200/40"
        >
          <div className="h-1.5 bg-gradient-to-r from-sage-300 via-brand-300 to-teal-300" />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-cream-100 bg-gradient-to-r from-cream-50/80 to-sage-50/40">
                  <th className="w-48 py-4 pl-5 pr-4 text-left text-sm font-medium text-cream-800/50">Özellik</th>
                  {displayPlans.map((plan) => {
                    const theme = getPlanTheme(plan.id)
                    return (
                      <th key={plan.id} className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${theme.iconIdle}`}>
                            {planIcon(plan.id, 'h-4 w-4')}
                          </span>
                          <span className={`font-display text-sm font-bold ${theme.label}`}>{plan.name}</span>
                          <span className="text-xs font-medium text-cream-800/50">
                            {plan.price === 0 ? 'Ücretsiz' : formatMonthlyPrice(plan.price)}
                          </span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={`border-b border-cream-50 transition hover:bg-sage-50/30 ${i % 2 === 0 ? 'bg-white' : 'bg-cream-50/30'}`}
                  >
                    <td className="py-3.5 pl-5 pr-4 text-sm font-medium text-cream-900">{row.feature}</td>
                    {displayPlans.map((plan) => (
                      <td key={plan.id} className="px-3 py-3.5 text-center text-sm">
                        <CellValue value={row[plan.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-10">
          <MembershipReassurance />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-cream-800/60">Hâlâ emin değil misiniz?</p>
          <Link
            to="/onboarding?plan=free"
            className="btn-wellness mt-4 inline-flex !px-8 !py-3.5"
          >
            Ücretsiz başlayın — risk yok
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
