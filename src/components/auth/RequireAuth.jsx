import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { shouldSkipReturnUrl } from '../../utils/authRedirect'
import LoadingScreen from '../ui/LoadingScreen'

/**
 * Oturum ve rol kontrolü. Giriş yapmamış kullanıcıları login'e yönlendirir.
 * @param {'member'|'staff'|'admin'|null} role - null = herhangi bir oturum
 */
export default function RequireAuth({ role = null }) {
  const { isAuthenticated, isAdmin, isStaff, loading } = useApp()
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

  if (role === 'admin' && !isAdmin) {
    if (isStaff) return <Navigate to="/staff" replace />
    return <Navigate to="/profile" replace />
  }

  if (role === 'staff' && !isStaff) {
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/profile" replace />
  }

  if (role === 'member' && (isAdmin || isStaff)) {
    if (isAdmin) return <Navigate to="/admin" replace />
    return <Navigate to="/staff" replace />
  }

  return <Outlet />
}
