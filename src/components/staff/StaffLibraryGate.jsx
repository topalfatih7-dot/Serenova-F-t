import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ExerciseLibraryPage from '../../pages/ExerciseLibraryPage'
import { normalizeStaffRole } from '../../utils/staffRoles'

/** Diyetisyenlerin video kütüphanesine erişimini engeller; koç ve doktor izleyebilir. */
export default function StaffLibraryGate() {
  const { staffUser } = useApp()
  const role = normalizeStaffRole(staffUser?.role)

  if (role === 'dietitian') {
    return <Navigate to="/staff/lists" replace />
  }

  if (role === 'coach' || role === 'doctor') {
    return <ExerciseLibraryPage staffMode />
  }

  return <Navigate to="/staff" replace />
}
