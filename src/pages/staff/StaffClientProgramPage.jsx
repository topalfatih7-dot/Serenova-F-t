import { useMemo } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'
import { getStaffClients } from '../../utils/chatAccess'
import CoachProgramEditor from '../../components/staff/CoachProgramEditor'

export default function StaffClientProgramPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const { staffUser, platform, createProgram } = useApp()
  const { toast } = useToast()

  const isCoach = staffUser?.role === 'coach'
  const member = useMemo(() => {
    const clients = getStaffClients(platform.members, staffUser?.role, staffUser?.id)
    return clients.find((m) => String(m.id) === String(memberId)) || null
  }, [platform.members, staffUser?.role, staffUser?.id, memberId])

  if (!isCoach) return <Navigate to="/staff/clients" replace />

  const handleSubmit = async (data) => {
    const created = await createProgram({
      type: 'workout',
      memberId: member.id,
      memberName: member.name,
      staffId: staffUser.id,
      staffName: staffUser.name,
      ...data,
    })
    if (!created) return false
    toast(`${member.name} için program gönderildi`, 'success')
    navigate('/staff/clients')
    return true
  }

  return (
    <CoachProgramEditor
      member={member}
      onSubmit={handleSubmit}
      backTo="/staff/clients"
      backLabel="Danışanlarım"
    />
  )
}
