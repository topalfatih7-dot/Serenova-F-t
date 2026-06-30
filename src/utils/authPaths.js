/** İlk hydrate bitmeden render edilmesi gereken auth rotaları */
export const AUTH_FAST_PATHS = [
  '/login',
  '/onboarding',
  '/auth/callback',
  '/forgot-password',
  '/reset-password',
]

export function isAuthFastPath(pathname = '') {
  return AUTH_FAST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}
