import { Crown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, sortPlansForDisplay, RECOMMENDED_PLAN, RECOMMENDED_DURATION_MONTHS } from '../data/membershipPlans'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import MembershipReassurance from '../components/membership/MembershipReassurance'
import MembershipTrialCta from '../components/membership/MembershipTrialCta'
import MembershipComparisonSection from '../components/membership/MembershipComparisonSection'
import PricingCard from '../components/landing/PricingCard'
import { getPlanCtaLabel } from '../utils/planCta'

// /membership sayfasındaki tablo ile aynı içerik — panel içi görünüm
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

export default function MemberPlansPage() {
  const { plans, membership, user } = useApp()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const displayPlans = allPlans.filter((p) => p.id !== membership)
  const comparisonPlans = displayPlans.filter((p) => p.id !== 'doktor')

  const ctaForPlan = (plan) => getPlanCtaLabel(plan, {
    forMember: true,
    member: user,
    currentMembership: membership,
  })

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Planlar"
        subtitle="Planınızı yükseltebilir veya ek paket satın alabilirsiniz. Yeni kayıt gerekmez."
        icon={Crown}
        accent="brand"
      />

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

      <MembershipComparisonSection
        comparisonPlans={comparisonPlans}
        comparisonRows={comparisonRows}
        isMember
        membership={membership}
        user={user}
      />

      <MembershipTrialCta isMember />

      <MembershipReassurance />
    </PanelPageShell>
  )
}
