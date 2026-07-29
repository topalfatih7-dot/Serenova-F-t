/** İlk hydrate bitmeden render edilmesi gereken auth rotaları */
export const AUTH_FAST_PATHS = [
  '/login',
  '/onboarding',
  '/auth/callback',
  '/forgot-password',
  '/reset-password',
]

/**
 * Marketing / public içerik — tam LoadingScreen ile bloklanmaz.
 * Hydrate arka planda biter; panel/korumalı rotalar bekler.
 */
export const PUBLIC_HYDRATE_PASS_THROUGH = [
  '/',
  '/membership',
  '/hakkimizda',
  '/about',
  '/stories',
  '/blog',
  '/corporate',
  '/team',
  '/legal',
  '/kvkk',
  '/privacy',
  '/terms',
  '/online-diyetisyen',
  '/online-kocluk',
]

export function isAuthFastPath(pathname = '') {
  return AUTH_FAST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export function isHydratePassThrough(pathname = '') {
  if (isAuthFastPath(pathname)) return true
  if (pathname === '/') return true
  return PUBLIC_HYDRATE_PASS_THROUGH.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(`${p}/`)),
  )
}
