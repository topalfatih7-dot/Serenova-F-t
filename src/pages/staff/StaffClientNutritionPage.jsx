import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import NutritionProgramBuilder from '../../components/staff/NutritionProgramBuilder'
import AvailabilityView from '../../components/package/AvailabilityView'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getStaffClients } from '../../utils/chatAccess'
import {
  findEntriesOutsidePackage,
  getMemberPackageDateRange,
  getPackageWindowsForProgramType,
  isDateInPackageWindows,
  memberHasProgramTypePackage,
} from '../../utils/programPackageScope'
import { format, addDays } from 'date-fns'

export default function StaffClientNutritionPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { staffUser, platform, createProgram } = useApp()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const isDietitian = staffUser?.role === 'dietitian'

  const member = useMemo(() => {
    const clients = getStaffClients(platform.members, staffUser?.role, staffUser?.id)
    return clients.find((m) => String(m.id) === String(memberId)) || null
  }, [platform.members, staffUser?.role, staffUser?.id, memberId])

  const packageRange = useMemo(
    () => (member ? getMemberPackageDateRange(member, 'nutrition') : null),
    [member],
  )

  if (!isDietitian) {
    return <Navigate to="/staff/clients" replace />
  }

  if (!member) {
    return (
      <div className="space-y-4">
        <Link to="/staff/clients" className="inline-flex items-center gap-2 text-sm font-medium text-sage-600 hover:text-sage-700">
          <ArrowLeft className="h-4 w-4" /> Danışanlarım
        </Link>
        <p className="text-sm text-cream-800/60">Danışan bulunamadı veya size atanmamış.</p>
      </div>
    )
  }

  const handleCreateNutrition = async (data) => {
    if (submitting) return
    if (!memberHasProgramTypePackage(member, 'nutrition')) {
      toast('Üyenin bu program türü için aktif paketi yok', 'error')
      return
    }
    const outside = findEntriesOutsidePackage(data.entries || [], member, 'nutrition')
    if (outside.length) {
      const dates = [...new Set(outside.map((e) => e.date))].join(', ')
      toast(`Paket süresi dışındaki tarihler: ${dates}`, 'error')
      return
    }
    if (data.scheduleType === 'cycle14' && data.cycleStartDate) {
      const windows = getPackageWindowsForProgramType(member, 'nutrition')
      if (!isDateInPackageWindows(data.cycleStartDate, windows)) {
        toast('Liste başlangıç tarihi üyenin paket süresi içinde olmalı', 'error')
        return
      }
      const endDate = format(
        addDays(new Date(`${data.cycleStartDate}T12:00:00`), (data.cycleLength || 14) - 1),
        'yyyy-MM-dd',
      )
      if (!isDateInPackageWindows(endDate, windows)) {
        toast('14 günlük listenin bitiş tarihi paket süresini aşıyor', 'error')
        return
      }
    }

    setSubmitting(true)
    try {
      const created = await createProgram({
        type: 'nutrition',
        memberId: member.id,
        memberName: member.name,
        staffId: staffUser.id,
        staffName: staffUser.name,
        ...data,
      })
      if (!created) {
        toast('Program kaydedilemedi. Lütfen tekrar deneyin.', 'error')
        return
      }
      toast(`${member.name} için liste oluşturuldu — danışana bildirim gönderildi`, 'success')
      navigate('/staff/clients')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div>
        <Link
          to="/staff/clients"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-sage-600 hover:text-sage-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Danışanlarım
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight text-cream-900 sm:text-4xl">
          {member.name}
        </h1>
        <p className="mt-2 max-w-xl text-base text-cream-800/65">
          Beslenme listesi hazırlayın · öğünleri ekleyip gönderin
        </p>
      </div>

      <div className="rounded-3xl border border-sage-100 bg-gradient-to-br from-sage-50/80 to-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-cream-900">Paket & bağlam</p>
            <p className="mt-1 text-sm text-cream-800/60">
              Liste tarihleri üyenin aktif diyetisyen paketi içinde kalmalıdır
            </p>
          </div>
          {packageRange && (
            <p className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-cream-800/70 ring-1 ring-cream-100">
              Paket: {packageRange.start}{packageRange.end ? ` — ${packageRange.end}` : ' (süresiz)'}
            </p>
          )}
        </div>
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-cream-800/80">Antrenman müsaitliği (bilgi)</p>
          <AvailabilityView value={member.availability} emptyText="Danışan henüz müsaitlik belirtmemiş." />
        </div>
      </div>

      <div className="rounded-3xl border border-cream-200 bg-white p-5 shadow-sm sm:p-8">
        <NutritionProgramBuilder packageRange={packageRange} onCreate={handleCreateNutrition} />
      </div>
    </div>
  )
}
