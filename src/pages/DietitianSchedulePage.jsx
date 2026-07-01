import MemberScheduleView, { dietitianMonthlyLimit } from '../components/calendar/MemberScheduleView'
import { useApp } from '../context/AppContext'
import { packageIncludesDietitian } from '../data/membershipPlans'
import { Apple } from 'lucide-react'

export default function DietitianSchedulePage() {
  const { dietitianSessions, packageConfig } = useApp()

  return (
    <MemberScheduleView
      type="dietitian"
      title="Diyetisyen Randevuları"
      subtitle="Beslenme rehberliği — tıbbi tedavi değildir"
      icon={Apple}
      accent="sage"
      sessions={dietitianSessions}
      canBook={packageIncludesDietitian(packageConfig)}
      monthlyLimit={dietitianMonthlyLimit(packageConfig)}
      lockedTitle="Diyetisyen randevuları paketinizde yok"
      lockedDescription="Beslenme rehberliği için diyetisyen içeren bir pakete geçin."
    />
  )
}
