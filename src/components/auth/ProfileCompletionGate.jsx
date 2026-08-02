import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { hasRegisteredMember, isSocialAuthUser } from '../../utils/memberProfile'
import LoadingScreen from '../ui/LoadingScreen'

/** Kayıt tamamlanmamış üyeleri onboarding'e yönlendirir. */
export default function ProfileCompletionGate() {
  const { isAdmin, isStaff, user, authUser, loading } = useApp()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (isAdmin || isStaff) return <Outlet />

  const onOnboarding = location.pathname === '/onboarding'
  const needsRegistration = !hasRegisteredMember(user)

  if (needsRegistration && !onOnboarding) {
    const plan = new URLSearchParams(location.search).get('plan') || 'free'
    const oauth = isSocialAuthUser(authUser) ? 'oauth=1&' : ''
    return <Navigate to={`/onboarding?${oauth}plan=${encodeURIComponent(plan)}`} replace />
  }

  return <Outlet />
}
