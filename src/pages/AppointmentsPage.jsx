import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Dumbbell, Apple, Stethoscope } from 'lucide-react'
import MemberScheduleView from '../components/calendar/MemberScheduleView'
import { coachMonthlyLimit, dietitianMonthlyLimit } from '../components/calendar/memberScheduleLimits'
import { useApp } from '../context/AppContext'
import {
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '../data/membershipPlans'

const TABS = [
  { id: 'coach', label: 'Koç', icon: Dumbbell },
  { id: 'dietitian', label: 'Diyetisyen', icon: Apple },
  { id: 'doctor', label: 'Doktor', icon: Stethoscope },
]

export default function AppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    coachSessions,
    dietitianSessions,
    doctorSessions,
    packageConfig,
  } = useApp()

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab')
    return TABS.some((t) => t.id === tab) ? tab : 'coach'
  }, [searchParams])

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-2xl border border-cream-200 bg-white p-1.5 shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition min-w-[7rem] ${
              activeTab === id
                ? 'bg-brand-500 text-white shadow-md'
                : 'text-cream-800 hover:bg-cream-50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'coach' && (
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
      )}

      {activeTab === 'dietitian' && (
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
      )}

      {activeTab === 'doctor' && (
        <MemberScheduleView
          type="doctor"
          title="Doktor Randevuları"
          subtitle="Online sağlık görüşmeleriniz"
          icon={Stethoscope}
          accent="teal"
          sessions={doctorSessions}
          canBook={packageIncludesDoctor(packageConfig)}
          monthlyLimit={1}
          lockedTitle="Doktor randevuları paketinizde yok"
          lockedDescription="Online doktor görüşmesi için Doktor Paketi veya VIP pakete geçin."
        />
      )}
    </div>
  )
}
