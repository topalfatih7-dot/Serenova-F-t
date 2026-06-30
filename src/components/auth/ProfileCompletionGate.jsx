import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { memberNeedsProfileCompletion } from '../../utils/memberProfile'

/** OAuth ile giriş yapan ancak telefon vb. eksik üyeleri kayıt tamamlamaya yönlendirir. */
export default function ProfileCompletionGate() {
  const { isAdmin, isStaff, user, loading } = useApp()
  const location = useLocation()

  if (loading) return null
  if (isAdmin || isStaff) return <Outlet />

  const needsCompletion = memberNeedsProfileCompletion(user)
  const onOnboarding = location.pathname === '/onboarding'

  if (needsCompletion && !onOnboarding) {
    const plan = new URLSearchParams(location.search).get('plan') || 'free'
    return <Navigate to={`/onboarding?oauth=1&plan=${plan}`} replace />
  }

  return <Outlet />
}
