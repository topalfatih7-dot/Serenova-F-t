import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ExerciseLibraryPage from '../../pages/ExerciseLibraryPage'
import { normalizeStaffRole } from '../../utils/staffRoles'

/** Tam hareket kütüphanesi yalnızca koçlar için; diyetisyen listelere yönlendirilir. */
export default function StaffLibraryGate() {
  const { staffUser } = useApp()
  const role = normalizeStaffRole(staffUser?.role)

  if (role === 'coach') {
    return <ExerciseLibraryPage staffMode />
  }

  if (role === 'dietitian') {
    return <Navigate to="/staff/lists" replace />
  }

  return <Navigate to="/staff" replace />
}
