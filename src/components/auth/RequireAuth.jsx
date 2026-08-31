import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { shouldSkipReturnUrl } from '../../utils/authRedirect'
import LoadingScreen from '../ui/LoadingScreen'

/**
 * Oturum ve rol kontrolü. Giriş yapmamış kullanıcıları login'e yönlendirir.
 * @param {'member'|'staff'|'admin'|'influencer'|null} role - null = herhangi bir oturum
 */
export default function RequireAuth({ role = null }) {
  const { isAuthenticated, isAdmin, isStaff, isInfluencer, loading } = useApp()
  const location = useLocation()

  if (loading) return <LoadingScreen />

  if (!isAuthenticated) {
    if (shouldSkipReturnUrl()) {
      return <Navigate to="/login" replace />
    }
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname + location.search,
          message: 'Bu sayfaya erişmek için giriş yapmanız gerekiyor.',
        }}
      />
    )
  }

  const bounce = () => {
    if (isAdmin) return <Navigate to="/admin" replace />
    if (isStaff) return <Navigate to="/staff" replace />
    if (isInfluencer) return <Navigate to="/influencer" replace />
    return <Navigate to="/profile" replace />
  }

  if (role === 'admin' && !isAdmin) return bounce()
  if (role === 'staff' && !isStaff) return bounce()
  if (role === 'influencer' && !isInfluencer) return bounce()
  if (role === 'member' && (isAdmin || isStaff || isInfluencer)) return bounce()

  return <Outlet />
}
