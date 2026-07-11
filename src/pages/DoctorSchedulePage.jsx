import MemberScheduleView from '../components/calendar/MemberScheduleView'
import { doctorMonthlyLimit } from '../components/calendar/memberScheduleLimits'
import { useApp } from '../context/AppContext'
import { packageIncludesDoctor } from '../data/membershipPlans'
import { Stethoscope } from 'lucide-react'

export default function DoctorSchedulePage() {
  const { doctorSessions, packageConfig, user } = useApp()

  return (
    <MemberScheduleView
      type="doctor"
      title="Doktor Randevuları"
      subtitle="Sağlık danışmanlığı — tıbbi teşhis veya tedavi yerine geçmez"
      icon={Stethoscope}
      accent="teal"
      sessions={doctorSessions || []}
      canBook={packageIncludesDoctor(packageConfig)}
      monthlyLimit={doctorMonthlyLimit(packageConfig, user)}
      lockedTitle="Doktor randevuları Doktor Paketi ile kullanılabilir"
      lockedDescription="Tek seferlik online doktor görüşmesi için Doktor Paketi'ni satın alın (1.500₺)."
    />
  )
}
