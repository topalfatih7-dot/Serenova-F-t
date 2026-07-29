import { useMemo, useState, useCallback } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, HeartPulse, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import MemberHealthProfilePanel from '../../components/member/MemberHealthProfilePanel'
import { getStaffClients } from '../../utils/chatAccess'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'
import { isCoachRole, isDietitianRole } from '../../utils/staffRoles'
import { isPaidMembership } from '../../data/membershipPlans'
import { isHealthAnalysisStale } from '../../services/healthScoreAnalysis'
import { useStaffHealthAnalysisRerun } from '../../hooks/useStaffHealthAnalysisRerun'

export default function MemberHealthProfilePage({ audience = 'staff' }) {
  const { memberId } = useParams()
  const { platform, staffUser, adminPatchMember, staffPatchMember, isAdmin } = useApp()
  const { toast } = useToast()
  const [savingNotes, setSavingNotes] = useState(false)

  const member = useMemo(
    () => (platform?.members || []).find((m) => m.id === memberId) || null,
    [platform?.members, memberId],
  )

  const canAccess = useMemo(() => {
    if (!member) return false
    if (audience === 'admin') return isAdmin
    if (!staffUser?.id) return false
    const clients = getStaffClients(platform?.members || [], staffUser.role, staffUser.id)
    return clients.some((c) => c.id === memberId)
  }, [audience, isAdmin, member, memberId, platform?.members, staffUser])

  const backPath = audience === 'admin' ? '/admin/members' : '/staff/clients'

  const noteAuthor = audience === 'admin'
    ? { id: 'admin', name: 'Admin', role: 'admin' }
    : { id: staffUser?.id, name: staffUser?.name, role: staffUser?.role }

  const handleSaveNotes = useCallback(async (healthStaffNotes) => {
    if (!member) return
    setSavingNotes(true)
    try {
      if (audience === 'admin') {
        await adminPatchMember(member.id, { healthStaffNotes })
      } else {
        await staffPatchMember(member.id, { healthStaffNotes })
      }
      toast('Not kaydedildi', 'success')
    } catch {
      toast('Not kaydedilemedi', 'error')
    } finally {
      setSavingNotes(false)
    }
  }, [member, audience, adminPatchMember, staffPatchMember, toast])

  const patchMember = useCallback(async (memberId, patch) => {
    if (audience === 'admin') return adminPatchMember(memberId, patch)
    return staffPatchMember(memberId, patch)
  }, [audience, adminPatchMember, staffPatchMember])

  const {
    rerun,
    loading: analysisRerunning,
    error: analysisRerunError,
  } = useStaffHealthAnalysisRerun({
    member,
    packageConfig: member?.packageConfig,
    patchMember,
  })

  const memberPaid = Boolean(member && isPaidMembership(member.membership))

  const analysisStale = useMemo(
    () => (member && memberPaid ? isHealthAnalysisStale(member.healthAnalysis, member) : false),
    [member, memberPaid],
  )

  const handleRerunAnalysis = useCallback(async () => {
    if (!memberPaid) {
      toast('Yeniden analiz yalnızca aktif ücretli üyelikte kullanılabilir', 'error')
      return
    }
    const result = await rerun()
    if (result?.ok) toast('Sağlık analizi güncellendi', 'success')
    else toast(result?.error || 'Yeniden analiz başarısız', 'error')
  }, [rerun, toast, memberPaid])

  if (!member) {
    return (
      <PanelPageShell>
        <p className="text-sm text-cream-800/55">Üye bulunamadı.</p>
        <Link to={backPath} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-600">
          <ArrowLeft className="h-4 w-4" /> Geri dön
        </Link>
      </PanelPageShell>
    )
  }

  if (!canAccess) {
    return <Navigate to={backPath} replace />
  }

  return (
    <PanelPageShell>
      <div className="mb-4">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 text-sm font-medium text-cream-800/60 hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          {audience === 'admin' ? 'Üye listesi' : 'Danışanlarım'}
        </Link>
      </div>

      <PanelPageHeader
        title={member.name}
        subtitle="Sağlık profili"
        icon={HeartPulse}
        accent="brand"
      />

      {savingNotes && (
        <p className="mb-4 flex items-center gap-2 text-xs text-cream-800/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Not kaydediliyor…
        </p>
      )}

      <MemberHealthProfilePanel
        member={member}
        canWriteNotes
        noteAuthor={noteAuthor}
        onSaveNotes={handleSaveNotes}
        notesSaving={savingNotes}
        showHealthAnalysis={audience === 'admin'}
        showStaffBrief={
          audience === 'admin'
          || (audience === 'staff' && (isCoachRole(staffUser?.role) || isDietitianRole(staffUser?.role)))
        }
        analysisStale={analysisStale}
        onRerunAnalysis={handleRerunAnalysis}
        analysisRerunning={analysisRerunning}
        analysisRerunError={analysisRerunError}
      />
    </PanelPageShell>
  )
}
