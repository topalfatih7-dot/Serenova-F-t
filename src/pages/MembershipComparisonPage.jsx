import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, X, Star, ArrowRight, Sparkles } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, formatPlanPrice, sortPlansForDisplay } from '../data/membershipPlans'
import MembershipHero from '../components/membership/MembershipHero'
import MembershipReassurance from '../components/membership/MembershipReassurance'
import MembershipComparisonAccordion from '../components/membership/MembershipComparisonAccordion'
import PricingCard from '../components/landing/PricingCard'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import JsonLd from '../components/seo/JsonLd'
import { getPlanTheme, planIcon } from '../components/membership/planTheme'
import { getPlanCtaLabel } from '../utils/planCta'
import { RECOMMENDED_PLAN, getDurationSavingsPercent, RECOMMENDED_DURATION_MONTHS } from '../data/membershipPlans'
import { buildFaqSchema } from '../config/seo'

const comparisonRows = [
  { feature: 'Yeniform Kişisel Sağlık Analizi', free: true, eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
  { feature: 'Doktor tarafından kan tahlili analizi', free: false, eko_diyet: true, diyet: true, eko_spor: false, spor: false, vip: true },
  { feature: 'Manuel Kalori Hesaplama', free: false, eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
  { feature: 'Fotoğraflı Kalori Tespiti', free: false, eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
  { feature: 'Diyetisyen Görüşmesi / Ay', free: false, eko_diyet: '1', diyet: '2', eko_spor: false, spor: false, vip: '2' },
  { feature: 'Koç Görüşmesi / Ay', free: false, eko_diyet: false, diyet: false, eko_spor: '1', spor: '2', vip: '2' },
  { feature: 'Diyet Programı', free: false, eko_diyet: 'Kişiye özel', diyet: 'Kişiye özel', eko_spor: false, spor: false, vip: 'Kişiye özel' },
  { feature: 'Spor Programı', free: false, eko_diyet: false, diyet: false, eko_spor: 'Kişiye özel', spor: 'Kişiye özel', vip: 'Kişiye özel' },
  { feature: 'Hareket kütüphanesi', free: 'Temel', eko_diyet: false, diyet: false, eko_spor: true, spor: true, vip: true },
  { feature: 'İlerleme Raporları', free: 'Temel', eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
  { feature: 'Destek', free: 'Standart', eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
]

const MEMBERSHIP_FAQ = [
  { q: 'Hangi paketlerle başlayabilirim?', a: 'Eko Diyet, Diyet, Eko Spor, Spor, Doktor veya VIP paketlerinden birini seçerek Stripe ile kayıt olabilirsiniz. Antrenman ve beslenme programları koç / diyetisyen tarafından hazırlanır.' },
  { q: 'Eko paketler ne fark eder?', a: 'Eko Diyet ve Eko Spor, ana paketlerle aynı özellikleri sunar; fark yalnızca ayda 1 görüşme hakkıdır (Diyet/Spor’da 2).' },
  { q: 'Online diyetisyen hangi pakette?', a: 'Ayda 1 görüşme Eko Diyet’te, ayda 2 Diyet ve VIP’tedir. Süreç özeti için online diyetisyen sayfamıza bakabilirsiniz.' },
  { q: 'Online koçluk hangi pakette?', a: 'Ayda 1 görüşme Eko Spor’da, ayda 2 Spor ve VIP’tedir. Ayrıntılar online koçluk hizmet sayfasında.' },
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
  const comparisonPlans = displayPlans.filter((p) => p.id !== 'doktor')

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
        title={isMember ? 'Planınızı güncelleyin veya paket ekleyin' : 'Online diyetisyen ve online koçluk paketleri'}
        subtitle={
          isMember
            ? 'Giriş yapmış hesabınızla plan değiştirebilir veya ek paket (ör. Doktor) satın alabilirsiniz. Yeni kayıt gerekmez.'
            : 'Video görüşmeli diyetisyen / koç paketlerinden birini seçin. Gizli ücret yok, süre seçimi sizde.'
        }
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        {!isMember && (
          <p className="mb-2 text-center text-sm text-cream-800/75">
            Hizmet detayı:{' '}
            <Link to="/online-diyetisyen" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              Online diyetisyen
            </Link>
            {' · '}
            <Link to="/online-kocluk" className="font-semibold text-brand-700 underline-offset-2 hover:underline">
              Online koçluk
            </Link>
          </p>
        )}
      </div>

      {/* Plan kartları — ana sayfadaki grid + PricingCard */}
      <PlansAnimatedBackground className="plans-section-ref !py-10 sm:!py-14">
        <div className="mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '50px' }}
            className="plans-ref-heading text-center"
          >
            <span className="plans-ref-badge">
              <Star className="h-3 w-3 fill-current" aria-hidden />
              Üyelik Planları
            </span>
            <h2 className="section-title mt-3 text-[clamp(1.5rem,3.2vw,2.15rem)]">
              Hedefinize{' '}
              <span className="bg-gradient-to-r from-sage-600 to-brand-600 bg-clip-text text-transparent">
                uygun planı
              </span>{' '}
              seçin.
            </h2>
            <p className="section-subtitle mx-auto mt-2 max-w-2xl text-sm text-slate-600">
              Yeni Form&apos;un tüm planları uzman desteğiyle hazırlanır. İhtiyaçlarınıza ve
              hedeflerinize göre planınızı yükseltebilir veya değiştirebilirsiniz.
            </p>
          </motion.div>

          <div className="plans-cards-grid mt-5 sm:mt-6 lg:mt-8">
            {displayPlans.map((plan, i) => (
              <div
                key={plan.id}
                className={`plans-card-reveal plans-card-reveal-delay-${Math.min(i + 1, 3)} relative min-w-0`}
              >
                <PricingCard
                  plan={plan}
                  featured={plan.id === 'vip'}
                  ctaTo={`/onboarding?plan=${plan.id}${plan.id === RECOMMENDED_PLAN ? `&months=${RECOMMENDED_DURATION_MONTHS}` : ''}`}
                  ctaLabel={ctaForPlan(plan)}
                />
              </div>
            ))}
          </div>

          {displayPlans.some((p) => p.id === RECOMMENDED_PLAN) && (
            <p className="mt-6 text-center text-sm text-cream-800/65">
              <span className="font-semibold text-amber-800">VIP 6 aylık paket</span>
              {' '}— %{getDurationSavingsPercent(RECOMMENDED_PLAN, RECOMMENDED_DURATION_MONTHS)} tasarruf ile en avantajlı seçenek.
            </p>
          )}
        </div>
      </PlansAnimatedBackground>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        {/* Karşılaştırma — asimetrik bölüm */}
        <section className="membership-section-asymmetric mt-4 rounded-3xl px-4 py-10 sm:px-6 sm:py-12">
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
                  plans={comparisonPlans}
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
                      {comparisonPlans.map((plan) => {
                        const theme = getPlanTheme(plan)
                        const isVip = plan.id === RECOMMENDED_PLAN
                        return (
                          <th key={plan.id} className={`px-3 py-4 text-center ${isVip ? 'bg-amber-50/60' : ''}`}>
                            <Link
                              to={`/onboarding?plan=${plan.id}`}
                              className="group flex flex-col items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-brand-50/60"
                            >
                              <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition group-hover:scale-105 ${theme.iconIdle}`}>
                                {planIcon(plan, 'h-4 w-4')}
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
                        {comparisonPlans.map((plan) => (
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
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mt-10 overflow-hidden rounded-3xl border border-sage-200/60 bg-gradient-to-br from-white via-sage-50/40 to-brand-50/50 p-8 text-center shadow-sm shadow-sage-100/50 sm:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-sage-200/40 blur-3xl"
          />
          <div className="relative z-[1]">
            {isMember ? (
              <>
                <p className="text-sm text-cream-800/65">
                  Mevcut planınıza dönmek veya detayları görmek için profilinize gidin.
                </p>
                <Link
                  to="/profile"
                  className="btn-wellness mt-5 inline-flex !px-8 !py-3.5"
                >
                  Profilime dön
                </Link>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-sage-700 ring-1 ring-sage-200/80 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                  48 saat deneme
                </span>
                <h3 className="mt-4 font-display text-xl font-bold text-cream-900 sm:text-2xl">
                  Hâlâ emin değil misiniz?
                </h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-cream-800/65">
                  Ücretsiz kaydolun, sağlık skorlarınızı ve paneli deneyin — kredi kartı gerekmez.
                </p>
                <motion.div
                  className="mt-6 inline-flex"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Link
                    to="/onboarding?plan=free"
                    className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-brand-500 via-brand-600 to-sage-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/35 transition hover:brightness-110 sm:text-base"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                    />
                    Ücretsiz başla
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </Link>
                </motion.div>
              </>
            )}
          </div>
        </motion.div>

        <div className="mt-10">
          <MembershipReassurance />
        </div>
      </div>
    </div>
  )
}
