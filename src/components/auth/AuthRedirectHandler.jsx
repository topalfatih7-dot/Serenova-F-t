import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Supabase PKCE akışı doğrulama kodunu çoğu zaman Site URL köküne (?code=…) yollar.
 * Hash (#error=…) ve query parametrelerini birleştirip /auth/callback rotasına taşır.
 */
export default function AuthRedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Auth işlem sayfaları kendi parametrelerini kendileri yönetir — buradan dokunmayız.
    const AUTH_PAGES = ['/auth/callback', '/reset-password', '/login', '/forgot-password']
    if (AUTH_PAGES.includes(location.pathname)) return

    const params = new URLSearchParams(location.search)
    const hashRaw = (window.location.hash || '').replace(/^#/, '')
    const hashParams = new URLSearchParams(hashRaw)
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value)
    })

    const code = params.get('code')
    const authError = params.get('error')
    const errorCode = params.get('error_code')
    const tokenHash = params.get('token_hash')
    const flowType = params.get('type')
    const hasHashTokens = hashRaw.includes('access_token') || hashRaw.includes('type=')

    if (!code && !authError && !errorCode && !hasHashTokens && !tokenHash) return

    if (flowType === 'recovery' || hashRaw.includes('type=recovery')) {
      if (!params.has('next')) params.set('next', 'reset-password')
    } else if (!params.has('verify') && !params.has('next') && params.get('evt')) {
      // E-posta doğrulama bağlantılarımız evt jetonu taşır; yalnızca o zaman verify=email eklenir.
      params.set('verify', 'email')
    }

    const qs = params.toString()
    navigate(`/auth/callback${qs ? `?${qs}` : ''}`, { replace: true })
  }, [location.pathname, location.search, location.hash, navigate])

  return null
}
