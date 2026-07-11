import MemberScheduleView from '../components/calendar/MemberScheduleView'
import { coachMonthlyLimit } from '../components/calendar/memberScheduleLimits'
import { useApp } from '../context/AppContext'
import { packageIncludesCoach } from '../data/membershipPlans'
import { Dumbbell } from 'lucide-react'

export default function CoachSchedulePage() {
  const { coachSessions, packageConfig } = useApp()

  return (
    <MemberScheduleView
      type="coach"
      title="Koç Randevuları"
      subtitle="Birebir antrenman görüşmeleriniz"
      icon={Dumbbell}
      accent="brand"
      sessions={coachSessions}
      canBook={packageIncludesCoach(packageConfig)}
      monthlyLimit={coachMonthlyLimit(packageConfig)}
      lockedTitle="Koç randevuları paketinizde yok"
      lockedDescription="Birebir koç görüşmeleri için koç içeren bir pakete geçin."
    />
  )
}
