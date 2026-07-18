import { useMemo, useState, useCallback } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft, HeartPulse, Loader2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import MemberHealthProfilePanel from '../../components/member/MemberHealthProfilePanel'
import { getStaffClients } from '../../utils/chatAccess'
import { migrateLegacyHealthTestKeys } from '../../data/healthTest'
import PanelPageHeader, { PanelPageShell } from '../../components/layout/PanelPageHeader'

export default function MemberHealthProfilePage({ audience = 'staff' }) {
  const { memberId } = useParams()
  const { platform, staffUser, adminPatchMember, staffPatchMember, isAdmin, healthTestSchema } = useApp()
  const { toast } = useToast()
  const [savingNotes, setSavingNotes] = useState(false)
  const [savingHealthTest, setSavingHealthTest] = useState(false)
  const [editMode, setEditMode] = useState('view')
  const [editorDirty, setEditorDirty] = useState(false)

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

  const handleSaveHealthTest = useCallback(async (healthTest) => {
    if (!member) return
    setSavingHealthTest(true)
    try {
      const payload = migrateLegacyHealthTestKeys(healthTest)
      if (audience === 'admin') {
        await adminPatchMember(member.id, { healthTest: payload })
      } else {
        await staffPatchMember(member.id, { healthTest: payload })
      }
      toast('Sağlık testi kaydedildi', 'success')
      setEditorDirty(false)
      setEditMode('view')
    } catch (err) {
      toast('Sağlık testi kaydedilemedi', 'error')
      throw err
    } finally {
      setSavingHealthTest(false)
    }
  }, [member, audience, adminPatchMember, staffPatchMember, toast])

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
        subtitle={`Sağlık profili · ${member.email}`}
        icon={HeartPulse}
        accent="brand"
      />

      {(savingNotes || savingHealthTest) && (
        <p className="mb-4 flex items-center gap-2 text-xs text-cream-800/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {savingHealthTest ? 'Sağlık testi kaydediliyor…' : 'Not kaydediliyor…'}
        </p>
      )}

      <MemberHealthProfilePanel
        member={member}
        canWriteNotes
        noteAuthor={noteAuthor}
        onSaveNotes={handleSaveNotes}
        notesSaving={savingNotes}
        showHealthAnalysis={false}
        canEditHealthTest
        editMode={editMode}
        onEditModeChange={setEditMode}
        onSaveHealthTest={handleSaveHealthTest}
        healthTestSaving={savingHealthTest}
        editorDirty={editorDirty}
        onEditorDirtyChange={setEditorDirty}
        healthTestSchema={healthTestSchema}
      />
    </PanelPageShell>
  )
}
