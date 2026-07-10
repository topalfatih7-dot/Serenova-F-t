import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, HelpCircle, UserPlus, CreditCard, LayoutDashboard, RefreshCw } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, formatPlanPrice, sortPlansForDisplay } from '../data/membershipPlans'
import MembershipHero from '../components/membership/MembershipHero'
import MembershipPlanCard from '../components/membership/MembershipPlanCard'
import MembershipReassurance from '../components/membership/MembershipReassurance'
import MembershipComparisonAccordion from '../components/membership/MembershipComparisonAccordion'
import JsonLd from '../components/seo/JsonLd'
import { getPlanTheme, planIcon } from '../components/membership/planTheme'
import { getPlanCtaLabel } from '../utils/planCta'
import { RECOMMENDED_PLAN, getDurationSavingsPercent, RECOMMENDED_DURATION_MONTHS } from '../data/membershipPlans'
import { buildFaqSchema } from '../config/seo'

const comparisonRows = [
  { feature: 'Kişisel Sağlık & Vücut Analizi', free: true, eko: false, diyet: true, spor: true, vip: true, doktor: false },
  { feature: 'Manuel Kalori Hesaplama', free: false, eko: true, diyet: true, spor: true, vip: true, doktor: false },
  { feature: 'Fotoğraflı Kalori Tespiti', free: false, eko: false, diyet: true, spor: true, vip: true, doktor: false },
  { feature: 'Online Doktor Seansı', free: false, eko: false, diyet: false, spor: false, vip: false, doktor: true },
  { feature: 'Diyetisyen Görüşmesi / Ay', free: false, eko: false, diyet: '2', spor: false, vip: '2', doktor: false },
  { feature: 'Koç Görüşmesi / Ay', free: false, eko: false, diyet: false, spor: '2', vip: '2', doktor: false },
  { feature: 'Diyet Programı', free: 'Otomatik', eko: 'Ayda 2', diyet: 'Özel', spor: false, vip: 'Özel', doktor: false },
  { feature: 'Spor Programı', free: 'Otomatik', eko: 'Ayda 1', diyet: false, spor: 'Özel', vip: 'Özel', doktor: false },
  { feature: 'Video Kütüphanesi', free: 'Temel', eko: 'Sınırlı', diyet: false, spor: 'Sınırsız', vip: 'Sınırsız', doktor: false },
  { feature: 'İlerleme Raporları', free: 'Temel', eko: true, diyet: 'Sınırsız', spor: 'Sınırsız', vip: 'Sınırsız', doktor: false },
  { feature: 'Destek', free: 'Standart', eko: 'Standart', diyet: 'Sınırsız', spor: 'Sınırsız', vip: 'Sınırsız', doktor: false },
]

const HOW_IT_WORKS_SIGNUP = [
  { icon: UserPlus, title: '1. Planınızı seçin', desc: 'Ücretsiz başlayın veya hedefinize uygun paketi seçin — her plan net özelliklerle listelenir.' },
  { icon: CreditCard, title: '2. Güvenle kayıt olun', desc: 'Birkaç bilgi, şifre oluşturun. Ücretli planda güvenli ödeme ekranına geçersiniz.' },
  { icon: LayoutDashboard, title: '3. Hemen başlayın', desc: 'Dashboard\'ınız açılır; programlarınız ve uzman desteğiniz hazır.' },
]

const HOW_IT_WORKS_MEMBER = [
  { icon: RefreshCw, title: '1. Yeni planı seçin', desc: 'Mevcut planınız korunur; istediğiniz paketi listeden seçin.' },
  { icon: CreditCard, title: '2. Güvenle ödeyin', desc: 'Yeni hesap açılmaz — mevcut girişinizle ödeme yapıp planı güncellersiniz.' },
  { icon: LayoutDashboard, title: '3. Hemen kullanın', desc: 'Ek paketler mevcut üyeliğinize eklenir; haklarınız birleştirilir.' },
]

const MEMBERSHIP_FAQ = [
  { q: 'Ücretsiz Basic paketle başlayabilir miyim?', a: 'Evet. Basic paket ücretsizdir; kişisel sağlık analizi ve otomatik programlarla hemen başlayabilirsiniz.' },
  { q: 'VIP paket neden öneriliyor?', a: 'VIP paket koç, diyetisyen ve doktor desteğini tek planda birleştirir. 6 aylık seçimde en yüksek tasarruf oranına ulaşırsınız.' },
  { q: 'Planımı sonradan değiştirebilir miyim?', a: 'Evet. Giriş yaptıktan sonra üyelik sayfasından planınızı yükseltebilir veya ek paket satın alabilirsiniz.' },
]

function CellValue({ value }) {
  if (value === false) return <X className="mx-auto h-4 w-4 text-cream-300" />
  if (value === true) return <Check className="mx-auto h-4 w-4 text-sage-500" />
  return <span className="text-xs font-semibold text-cream-800">{value}</span>
}

export default function MembershipComparisonPage() {
  const { plans, isAuthenticated, isAdmin, isStaff, membership, user } = useApp()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const isMember = isAuthenticated && !isAdmin && !isStaff
  const displayPlans = isMember ? allPlans.filter((p) => p.id !== membership) : allPlans
  const howItWorks = isMember ? HOW_IT_WORKS_MEMBER : HOW_IT_WORKS_SIGNUP

  const ctaForPlan = (plan) => getPlanCtaLabel(plan, {
    forMember: isMember,
    member: user,
    currentMembership: membership,
  })

  return (
    <div className="membership-page-shell">
      <div aria-hidden className="membership-page-mesh membership-page-mesh-mid" />
      <div aria-hidden className="membership-page-dots" />
      <JsonLd data={buildFaqSchema(MEMBERSHIP_FAQ)} />
      <MembershipHero
        title={isMember ? 'Planınızı güncelleyin veya paket ekleyin' : 'Size en uygun planı seçin'}
        subtitle={
          isMember
            ? 'Giriş yapmış hesabınızla plan değiştirebilir veya ek paket (ör. Doktor) satın alabilirsiniz. Yeni kayıt gerekmez.'
            : 'Ücretsiz başlayın veya uzman destekli paketlerden birini seçin. Gizli ücret yok, süre seçimi sizde.'
        }
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
        {/* Nasıl üye olunur */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="membership-section-asymmetric rounded-3xl border border-sage-200/50 p-6 shadow-sm shadow-sage-100/40 sm:p-8"
        >
          <div aria-hidden className="about-mesh membership-mesh-how absolute inset-0 rounded-3xl" />
          <div aria-hidden className="about-mesh-dot absolute inset-0 rounded-3xl" />
          <div className="relative z-[1]">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sage-500 to-teal-600 text-white shadow-md">
                <HelpCircle className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-cream-900">
                  {isMember ? 'Plan nasıl değiştirilir?' : 'Nasıl üye olursunuz?'}
                </h2>
                <p className="mt-1 text-sm text-cream-800/65">
                  {isMember ? 'Üç basit adım — hesabınız aynı kalır.' : 'Üç basit adım — kafanızda soru işareti kalmadan.'}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {howItWorks.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="rounded-2xl border border-white/90 bg-white/85 p-4 shadow-sm backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-sage-500 text-white shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <h3 className="mt-3 text-sm font-bold text-cream-900">{step.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-cream-800/65">{step.desc}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.section>

        {/* Plan kartları */}
        <div className="relative mt-14">
          <div aria-hidden className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-brand-200/25 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -right-8 bottom-0 h-48 w-48 rounded-full bg-sage-200/30 blur-3xl" />
          <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayPlans.map((plan, i) => (
              <MembershipPlanCard
                key={plan.id}
                plan={plan}
                index={i}
                mode="link"
                recommended={plan.id === RECOMMENDED_PLAN}
                ctaTo={`/onboarding?plan=${plan.id}${plan.id === RECOMMENDED_PLAN ? `&months=${RECOMMENDED_DURATION_MONTHS}` : ''}`}
                ctaLabel={ctaForPlan(plan)}
              />
            ))}
          </div>
        </div>

        {displayPlans.some((p) => p.id === RECOMMENDED_PLAN) && (
          <p className="mt-6 text-center text-sm text-cream-800/65">
            <span className="font-semibold text-amber-800">VIP 6 aylık paket</span>
            {' '}— %{getDurationSavingsPercent(RECOMMENDED_PLAN, RECOMMENDED_DURATION_MONTHS)} tasarruf ile en avantajlı seçenek.
          </p>
        )}

        {/* Karşılaştırma — asimetrik bölüm */}
        <section className="membership-section-asymmetric mt-14 rounded-3xl px-4 py-10 sm:px-6 sm:py-12">
          <div aria-hidden className="about-mesh membership-mesh-compare absolute inset-0 rounded-3xl" />
          <div aria-hidden className="about-mesh-dot absolute inset-0 rounded-3xl" />
          <div className="relative z-[1]">
            <div className="md:hidden">
              <div className="text-center">
                <span className="section-badge">Detaylı Karşılaştırma</span>
                <h2 className="section-title mt-4">Planları karşılaştırın</h2>
              </div>
              <div className="mt-6">
                <MembershipComparisonAccordion
                  plans={displayPlans}
                  comparisonRows={comparisonRows}
                  isMember={isMember}
                  membership={membership}
                  user={user}
                />
              </div>
            </div>

            <div className="hidden text-center md:block">
              <span className="section-badge">Detaylı Karşılaştırma</span>
              <h2 className="section-title mt-4">Özellik özellik yan yana</h2>
              <p className="section-subtitle">Abonelik planlarında 1, 3 veya 6 aylık süre; Doktor Paketi tek seferliktir.</p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 hidden overflow-hidden rounded-3xl border border-cream-200/80 bg-white/95 shadow-lg shadow-cream-200/40 backdrop-blur-sm md:block"
            >
              <div className="h-1.5 bg-gradient-to-r from-sage-300 via-brand-300 to-teal-300" />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-cream-100 bg-gradient-to-r from-cream-50/80 to-sage-50/40">
                      <th className="w-48 py-4 pl-5 pr-4 text-left text-sm font-medium text-cream-800/50">Özellik</th>
                      {displayPlans.map((plan) => {
                        const theme = getPlanTheme(plan.id)
                        const isVip = plan.id === RECOMMENDED_PLAN
                        return (
                          <th key={plan.id} className={`px-3 py-4 text-center ${isVip ? 'bg-amber-50/60' : ''}`}>
                            <Link
                              to={`/onboarding?plan=${plan.id}`}
                              className="group flex flex-col items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-brand-50/60"
                            >
                              <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition group-hover:scale-105 ${theme.iconIdle}`}>
                                {planIcon(plan.id, 'h-4 w-4')}
                              </span>
                              <span className={`font-display text-sm font-bold ${theme.label}`}>{plan.name}</span>
                              <span className="text-xs font-medium text-cream-800/50">
                                {plan.price === 0 ? 'Ücretsiz' : formatPlanPrice(plan)}
                              </span>
                            </Link>
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
          </div>
        </section>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-cream-800/60">
            {isMember ? 'Mevcut planınıza dönmek veya detayları görmek için profilinize gidin.' : 'Hâlâ emin değil misiniz?'}
          </p>
          <Link
            to={isMember ? '/profile' : '/onboarding?plan=free'}
            className="btn-wellness mt-4 inline-flex !px-8 !py-3.5"
          >
            {isMember ? 'Profilime dön' : 'Ücretsiz başlayın'}
          </Link>
        </motion.div>

        <div className="mt-10">
          <MembershipReassurance />
        </div>
      </div>
    </div>
  )
}
