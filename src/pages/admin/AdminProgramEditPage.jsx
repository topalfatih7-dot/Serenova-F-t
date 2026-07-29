import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import CoachProgramEditor from '../../components/staff/CoachProgramEditor'
import NutritionProgramBuilder from '../../components/staff/NutritionProgramBuilder'
import { getMemberPackageDateRange } from '../../utils/programPackageScope'

export default function AdminProgramEditPage() {
  const { programId } = useParams()
  const navigate = useNavigate()
  const { platform, updateProgram } = useApp()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const program = useMemo(
    () => (platform.programs || []).find((p) => String(p.id) === String(programId)) || null,
    [platform.programs, programId],
  )

  const member = useMemo(() => {
    if (!program?.memberId) return null
    return (platform.members || []).find((m) => String(m.id) === String(program.memberId)) || null
  }, [platform.members, program])

  const isNutrition = program?.type === 'nutrition'
  const packageRange = useMemo(() => {
    if (!member) return null
    return getMemberPackageDateRange(member, isNutrition ? 'nutrition' : 'workout')
  }, [member, isNutrition])

  if (!program) {
    return (
      <div className="space-y-4">
        <Link to="/admin/programs" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Programlar
        </Link>
        <p className="text-sm text-cream-800/60">Program bulunamadı.</p>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Link to="/admin/programs" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Programlar
        </Link>
        <p className="text-sm text-cream-800/60">Programın üyesi bulunamadı.</p>
      </div>
    )
  }

  const handleWorkoutSubmit = async (data) => {
    const updated = await updateProgram(program.id, {
      type: 'workout',
      memberName: member.name,
      staffName: program.staffName,
      ...data,
    })
    if (!updated) return false
    toast('Antrenman programı güncellendi', 'success')
    navigate('/admin/programs')
    return true
  }

  const handleNutritionUpdate = async (payload) => {
    setSaving(true)
    try {
      const updated = await updateProgram(program.id, {
        type: 'nutrition',
        memberName: member.name,
        staffName: program.staffName,
        ...payload,
      })
      if (!updated) {
        toast('Liste kaydedilemedi', 'error')
        return
      }
      toast('Beslenme listesi güncellendi', 'success')
      navigate('/admin/programs')
    } finally {
      setSaving(false)
    }
  }

  if (isNutrition) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-10">
        <div>
          <Link to="/admin/programs" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Programlar
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
      backTo="/admin/programs"
      backLabel="Programlar"
      submitLabel="Programı Kaydet"
      submittingLabel="Kaydediliyor…"
      titleSuffix="Antrenman programını düzenle"
      relaxAvailability
    />
  )
}
