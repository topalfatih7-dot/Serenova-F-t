import { Navigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ExerciseLibraryPage from '../../pages/ExerciseLibraryPage'

/** Diyetisyenlerin video kütüphanesine erişimini engeller */
export default function StaffLibraryGate() {
  const { staffUser } = useApp()
  if (staffUser?.role === 'dietitian') {
    return <Navigate to="/staff/lists" replace />
  }
  return <ExerciseLibraryPage />
}
