import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Dumbbell, Apple, Stethoscope, CheckCircle } from 'lucide-react'
import MemberScheduleView from '../components/calendar/MemberScheduleView'
import { coachMonthlyLimit, dietitianMonthlyLimit } from '../components/calendar/memberScheduleLimits'
import { useApp } from '../context/AppContext'
import UnpaidMemberGate from '../components/membership/UnpaidMemberGate'
import {
  packageIncludesCoach,
  packageIncludesDietitian,
  packageIncludesDoctor,
} from '../data/membershipPlans'
import { doctorBookingLimit, doctorLimitIsOneTime } from '../utils/memberPackages'

const TABS = [
  {
    id: 'coach',
    label: 'Koç',
    hint: 'Antrenman seansı',
    icon: Dumbbell,
    active: 'border-brand-500 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-200/50',
    idle: 'border-brand-200/80 bg-gradient-to-br from-brand-50 to-sky-50/70 text-brand-950 hover:border-brand-300 hover:shadow-md',
    iconActive: 'bg-white/20 text-white',
    iconIdle: 'bg-brand-100 text-brand-600',
  },
  {
    id: 'dietitian',
    label: 'Diyetisyen',
    hint: 'Beslenme görüşmesi',
    icon: Apple,
    active: 'border-sage-500 bg-gradient-to-br from-sage-500 to-emerald-600 text-white shadow-lg shadow-sage-200/50',
    idle: 'border-sage-200/80 bg-gradient-to-br from-sage-50 to-emerald-50/70 text-sage-950 hover:border-sage-300 hover:shadow-md',
    iconActive: 'bg-white/20 text-white',
    iconIdle: 'bg-sage-100 text-sage-600',
  },
  {
    id: 'doctor',
    label: 'Doktor',
    hint: 'Sağlık görüşmesi',
    icon: Stethoscope,
    active: 'border-teal-500 bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg shadow-teal-200/50',
    idle: 'border-teal-200/80 bg-gradient-to-br from-teal-50 to-cyan-50/70 text-teal-950 hover:border-teal-300 hover:shadow-md',
    iconActive: 'bg-white/20 text-white',
    iconIdle: 'bg-teal-100 text-teal-700',
  },
]

export default function AppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    user,
    coachSessions,
    dietitianSessions,
    doctorSessions,
    packageConfig,
    isUnpaidMember,
  } = useApp()

  const doctorIsOneTime = doctorLimitIsOneTime(packageConfig)
  const doctorLimit = doctorIsOneTime
    ? (Number(packageConfig?.doctorSessionsTotal) || 0)
    : (Number(packageConfig?.doctorMeetingsPerMonth) || 0)
  const doctorCanBook = packageIncludesDoctor(packageConfig) && doctorBookingLimit(packageConfig, user) > 0

  const leftoverDoctor = Boolean(user?.assignedDoctorId) || (doctorSessions || []).length > 0

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab')
    return TABS.some((t) => t.id === tab) ? tab : 'coach'
  }, [searchParams])

  const setTab = (id) => {
    setSearchParams({ tab: id }, { replace: true })
  }

  if (isUnpaidMember && !leftoverDoctor) {
    return (
      <div className="space-y-5">
        <UnpaidMemberGate
          title="Randevular paket gerektirir"
          description="Bu sayfayı gezebilirsiniz. Koç, diyetisyen veya doktor randevusu almak için bir plan seçin."
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
        {TABS.map(({ id, label, hint, icon: Icon, active, idle, iconActive, iconIdle }) => {
          const selected = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-3 rounded-2xl border-2 px-3.5 py-3.5 text-left transition duration-200 sm:px-4 sm:py-4 ${
                selected ? active : idle
              }`}
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selected ? iconActive : iconIdle}`}>
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold leading-tight sm:text-[15px]">{label}</span>
                <span className={`mt-0.5 block text-[11px] leading-tight sm:text-xs ${selected ? 'text-white/80' : 'opacity-60'}`}>
                  {hint}
                </span>
              </span>
              {selected ? (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/25">
                  <CheckCircle className="h-3.5 w-3.5" />
                </span>
              ) : null}
            </button>
          )
        })}
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
          canBook={doctorCanBook}
          monthlyLimit={doctorLimit}
          limitScope={doctorIsOneTime ? 'all' : 'month'}
          lockedTitle="Doktor randevuları paketinizde yok"
          lockedDescription="Online doktor görüşmesi için Doktor Paketi satın alın. Diğer abonelik planlarına dahil değildir."
        />
      )}
    </div>
  )
}
