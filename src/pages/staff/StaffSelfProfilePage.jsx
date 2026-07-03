import { useApp } from '../../context/AppContext'
import StaffProfileEditor from '../../components/staff/StaffProfileEditor'

export default function StaffSelfProfilePage() {
  const { staffUser, updateStaffProfile } = useApp()

  return (
    <div className="w-full">
      <StaffProfileEditor
        staffUser={staffUser}
        onSave={(payload) => updateStaffProfile(staffUser.id, payload)}
      />
    </div>
  )
}
