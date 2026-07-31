import { useState } from 'react'
import { Crown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ALL_PLANS, sortPlansForDisplay } from '../data/membershipPlans'
import PanelPageHeader, { PanelPageShell } from '../components/layout/PanelPageHeader'
import MembershipComparisonSection from '../components/membership/MembershipComparisonSection'
import MemberPlanCheckout from '../components/membership/MemberPlanCheckout'

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
  const [searchParams] = useSearchParams()
  const allPlans = sortPlansForDisplay(plans?.length ? plans : ALL_PLANS)
  const selectable = allPlans.filter((p) => p.id !== membership)
  const comparisonPlans = selectable.filter((p) => p.id !== 'doktor')
  const queryPlan = searchParams.get('plan')
  const [selectedPlanId, setSelectedPlanId] = useState(() => {
    if (queryPlan && selectable.some((p) => p.id === queryPlan)) return queryPlan
    return selectable[0]?.id || null
  })

  return (
    <PanelPageShell>
      <PanelPageHeader
        title="Planlar"
        subtitle="Bir plan seçin, süreyi belirleyin ve ödemeye geçin. Yeni kayıt gerekmez."
        icon={Crown}
        accent="brand"
      />

      <MemberPlanCheckout
        plans={allPlans}
        membership={membership}
        userEmail={user?.email}
        selectedPlanId={selectedPlanId}
        onSelectedPlanChange={setSelectedPlanId}
      />

      <MembershipComparisonSection
        comparisonPlans={comparisonPlans}
        comparisonRows={comparisonRows}
        isMember
        membership={membership}
        user={user}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
      />
    </PanelPageShell>
  )
}
