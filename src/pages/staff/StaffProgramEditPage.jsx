import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import CoachProgramEditor from '../../components/staff/CoachProgramEditor'
import NutritionProgramBuilder from '../../components/staff/NutritionProgramBuilder'
import { getStaffClients } from '../../utils/chatAccess'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'

export default function StaffProgramEditPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { staffUser, platform, programs, updateProgram } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const role = staffUser?.role
  const isDietitian = role === 'dietitian'
  const isCoach = role === 'coach'

  const program = useMemo(() => {
    const found = (programs || []).find((p) => String(p.id) === String(programId)) || null
    if (!found) return null
    if (String(found.staffId) !== String(staffUser?.id)) return null
    return found
  }, [programs, programId, staffUser?.id])

  const member = useMemo(() => {
    if (!program?.memberId) return null
    const clients = getStaffClients(platform.members, staffUser?.role, staffUser?.id)
    return clients.find((m) => String(m.id) === String(program.memberId)) || null
  }, [platform.members, staffUser?.role, staffUser?.id, program])

  const isNutrition = program?.type === 'nutrition'
  const backTo = isNutrition ? '/staff/lists' : '/staff/programs'
  const backLabel = isNutrition ? 'Listelerim' : 'Programlar'

  const packageRange = useMemo(() => {
    if (!member) return null
    return getMemberPackageDateRange(member, isNutrition ? 'nutrition' : 'workout')
  }, [member, isNutrition])

  if (!isDietitian && !isCoach) {
    return <Navigate to="/staff/clients" replace />
  }

  if (!program) {
    return (
      <div className="space-y-4">
        <Link to={isDietitian ? '/staff/lists' : '/staff/programs'} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" /> {isDietitian ? 'Listelerim' : 'Programlar'}
        </Link>
        <p className="text-sm text-cream-800/60">Program bulunamadı veya size ait değil.</p>
      </div>
    )
  }

  if ((isDietitian && !isNutrition) || (isCoach && isNutrition)) {
    return <Navigate to={isDietitian ? '/staff/lists' : '/staff/programs'} replace />
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Link to={backTo} className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" /> {backLabel}
        </Link>
        <p className="text-sm text-cream-800/60">Programın üyesi bulunamadı veya size atanmamış.</p>
      </div>
    )
  }

  const handleWorkoutSubmit = async (data) => {
    const updated = await updateProgram(program.id, {
      type: 'workout',
      memberName: member.name,
      staffName: program.staffName || staffUser.name,
      ...data,
    })
    if (!updated) return false
    toast('Antrenman programı güncellendi', 'success')
    navigate('/staff/programs')
    return true
  }

  const handleNutritionUpdate = async (payload) => {
    if (saving) return
    if (!memberHasProgramTypePackage(member, 'nutrition')) {
      toast('Üyenin bu program türü için aktif paketi yok', 'error')
      return
    }
    const outside = findEntriesOutsidePackage(payload.entries || [], member, 'nutrition')
    if (outside.length) {
      const dates = [...new Set(outside.map((e) => e.date))].join(', ')
      toast(`Paket süresi dışındaki tarihler: ${dates}`, 'error')
      return
    }
    if (payload.scheduleType === 'cycle14' && payload.cycleStartDate) {
      const windows = getPackageWindowsForProgramType(member, 'nutrition')
      if (!isDateInPackageWindows(payload.cycleStartDate, windows)) {
        toast('Liste başlangıç tarihi üyenin paket süresi içinde olmalı', 'error')
        return
      }
      const endDate = format(
        addDays(new Date(`${payload.cycleStartDate}T12:00:00`), (payload.cycleLength || 14) - 1),
        'yyyy-MM-dd',
      )
      if (!isDateInPackageWindows(endDate, windows)) {
        toast('14 günlük listenin bitiş tarihi paket süresini aşıyor', 'error')
        return
      }
    }

    setSaving(true)
    try {
      const updated = await updateProgram(program.id, {
        type: 'nutrition',
        memberName: member.name,
        staffName: program.staffName || staffUser.name,
        ...payload,
      })
      if (!updated) {
        toast('Liste kaydedilemedi', 'error')
        return
      }
      toast('Beslenme listesi güncellendi', 'success')
      navigate('/staff/lists')
    } finally {
      setSaving(false)
    }
  }

  if (isNutrition) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-10">
        <div>
          <Link to={backTo} className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-sage-600 hover:text-sage-700">
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
          <h1 className="font-display text-2xl font-bold text-cream-900">{member.name}</h1>
          <p className="mt-1 text-sm text-cream-800/60">Beslenme listesini düzenle</p>
        </div>
        {saving && (
          <p className="flex items-center gap-2 text-sm text-cream-800/55">
            <Loader2 className="h-4 w-4 animate-spin" /> Kaydediliyor…
          </p>
        )}
        <NutritionProgramBuilder
          packageRange={packageRange}
          memberName={member.name}
          initialData={program}
          onUpdate={handleNutritionUpdate}
          submitLabel="Beslenme Listesini Kaydet"
        />
      </div>
    )
  }

  return (
    <CoachProgramEditor
      member={member}
      initialProgram={program}
      onSubmit={handleWorkoutSubmit}
      backTo={backTo}
      backLabel={backLabel}
      submitLabel="Programı Kaydet"
      submittingLabel="Kaydediliyor…"
      titleSuffix="Antrenman programını düzenle"
      relaxAvailability
    />
  )
}
