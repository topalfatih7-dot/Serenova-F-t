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
    if (location.pathname === '/auth/callback') return

    const params = new URLSearchParams(location.search)
    const hashRaw = (window.location.hash || '').replace(/^#/, '')
    const hashParams = new URLSearchParams(hashRaw)
    hashParams.forEach((value, key) => {
      if (!params.has(key)) params.set(key, value)
    })

    const code = params.get('code')
    const authError = params.get('error')
    const errorCode = params.get('error_code')
    const hasHashTokens = hashRaw.includes('access_token') || hashRaw.includes('type=')

    if (!code && !authError && !errorCode && !hasHashTokens) return

    if (!params.has('verify') && !params.has('next') && !params.get('type')) {
      if (hashRaw.includes('type=recovery') || params.get('type') === 'recovery') {
        params.set('next', 'reset-password')
      } else if (code || authError || errorCode === 'otp_expired' || params.get('evt')) {
        params.set('verify', 'email')
      }
    }

    const qs = params.toString()
    navigate(`/auth/callback${qs ? `?${qs}` : ''}`, { replace: true })
  }, [location.pathname, location.search, location.hash, navigate])

  return null
}
