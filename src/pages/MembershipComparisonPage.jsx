import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, sortPlansForDisplay } from '../data/membershipPlans'
import MembershipHero from '../components/membership/MembershipHero'
import MembershipReassurance from '../components/membership/MembershipReassurance'
import MembershipTrialCta from '../components/membership/MembershipTrialCta'
import MembershipComparisonSection from '../components/membership/MembershipComparisonSection'
import MemberPlanCheckout from '../components/membership/MemberPlanCheckout'
import PricingCard from '../components/landing/PricingCard'
import PlansAnimatedBackground from '../components/landing/PlansAnimatedBackground'
import JsonLd from '../components/seo/JsonLd'
import { getPlanCtaLabel } from '../utils/planCta'
import { RECOMMENDED_PLAN, RECOMMENDED_DURATION_MONTHS } from '../data/membershipPlans'
import { buildFaqSchema } from '../config/seo'

const comparisonRows = [
  { feature: 'Yeniform Kişisel Sağlık Analizi', free: true, eko_diyet: true, diyet: true, eko_spor: true, spor: true, vip: true },
  { feature: 'Kan Tahlili Testi Analizi', free: false, eko_diyet: true, diyet: true, eko_spor: false, spor: false, vip: true },
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
  { q: 'Hangi paketlerle başlayabilirim?', a: 'Tamamen ücretsiz başlayın, paneli keşfedin. Hedefinize uygun paketi — Eko Diyet, Diyet, Eko Spor, Spor veya VIP — seçerek yolculuğunuza devam edin. Programlarınız koç ve diyetisyen tarafından hazırlanır; ödemeler Stripe ile güvenle alınır.' },
  { q: 'Eko paketler ne fark eder?', a: 'Eko Diyet ve Eko Spor, ana paketlerle aynı özellikleri sunar; fark yalnızca ayda 1 görüşme hakkıdır (Diyet/Spor’da 2).' },
  { q: 'Online diyetisyen hangi pakette?', a: 'Ayda 1 görüşme Eko Diyet’te, ayda 2 Diyet ve VIP’tedir. Süreç online diyetisyen sayfasında; 2026 liste fiyatı online diyetisyen fiyat sayfasındadır.' },
  { q: 'Online koçluk hangi pakette?', a: 'Ayda 1 görüşme Eko Spor’da, ayda 2 Spor ve VIP’tedir. Ayrıntılar online koçluk hizmet sayfasında.' },
  { q: 'VIP paket neden öneriliyor?', a: 'VIP paket koç ve diyetisyen desteğini tek planda birleştirir. 6 aylık seçimde en yüksek tasarruf oranına ulaşırsınız.' },
  { q: 'Planımı sonradan değiştirebilir miyim?', a: 'Evet. Giriş yaptıktan sonra üyelik sayfasından planınızı yükseltebilirsiniz.' },
]

export default function MembershipComparisonPage() {
  const { plans, isAuthenticated, isAdmin, isStaff, membership, user } = useApp()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const isMember = isAuthenticated && !isAdmin && !isStaff
  const displayPlans = isMember ? allPlans.filter((p) => p.id !== membership) : allPlans
  const comparisonPlans = displayPlans
  const [selectedPlanId, setSelectedPlanId] = useState(() => displayPlans[0]?.id || null)

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
        title={isMember ? 'Planınızı güncelleyin veya paket ekleyin' : 'Üyelik paketleri: Diyet, Spor ve VIP'}
        subtitle={
          isMember
            ? 'Planı seçin, süreyi belirleyin ve ödemeye geçin. Yeni kayıt gerekmez.'
            : 'Paketleri karşılaştırın. Diyetisyen liste fiyatı ayrı sayfadadır; burada Diyet, Spor ve VIP yan yana durur.'
        }
      />

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
              {isMember
                ? 'Paketi seçin, 1 / 3 / 6 aylık süreyi belirleyin ve doğrudan ödemeye geçin.'
                : 'Yeni Form\'un tüm planları uzman desteğiyle hazırlanır. İhtiyaçlarınıza ve hedeflerinize göre planınızı seçin.'}
            </p>
          </motion.div>

          <div className="mt-5 sm:mt-6 lg:mt-8">
            {isMember ? (
              <MemberPlanCheckout
                plans={allPlans}
                membership={membership}
                userEmail={user?.email}
                member={user}
                selectedPlanId={selectedPlanId}
                onSelectedPlanChange={setSelectedPlanId}
              />
            ) : (
              <div className="plans-cards-grid">
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
            )}
          </div>
        </div>
      </PlansAnimatedBackground>

      <PlansAnimatedBackground className="plans-section-ref membership-compare-aurora-wrap !py-10 sm:!py-14">
        <div className="relative mx-auto w-full max-w-[92rem] px-4 sm:px-6 lg:px-8">
          <MembershipComparisonSection
            comparisonPlans={comparisonPlans}
            comparisonRows={comparisonRows}
            isMember={isMember}
            membership={membership}
            user={user}
            selectedPlanId={isMember ? selectedPlanId : null}
            onSelectPlan={isMember ? setSelectedPlanId : undefined}
          />
        </div>
      </PlansAnimatedBackground>

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
        <MembershipTrialCta isMember={isMember} />

        <div className="mt-5 sm:mt-6">
          <MembershipReassurance />
        </div>

        {!isMember && (
          <p className="mt-10 mb-2 text-center text-sm text-cream-800/75">
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
    </div>
  )
}
