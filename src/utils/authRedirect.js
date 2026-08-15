/** Intentional logout: RequireAuth should not stash return URL. */
let skipReturnUrl = false

export function markIntentionalLogout() {
  skipReturnUrl = true
}

/** True while intentional logout redirect is in flight (safe across Strict Mode re-renders). */
export function shouldSkipReturnUrl() {
  return skipReturnUrl
}

export function clearIntentionalLogout() {
  skipReturnUrl = false
}

export function homePathForRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'staff') return '/staff'
  return '/profile'
}

/**
 * Post-login return path must be same-origin relative and match the user's role.
 * @param {string|null|undefined} path
 * @param {'admin'|'staff'|'member'|string} role
 */
export function isSafeReturnPath(path, role) {
  if (!path || typeof path !== 'string') return false
  if (!path.startsWith('/') || path.startsWith('//')) return false
  if (path.startsWith('/login')) return false
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(path)) return false

  if (path === '/admin' || path.startsWith('/admin/')) {
    return role === 'admin'
  }
  if (path === '/staff' || path.startsWith('/staff/')) {
    return role === 'staff' || role === 'admin'
  }
  return true
}

export function resolvePostLoginPath(returnPath, role) {
  return isSafeReturnPath(returnPath, role) ? returnPath : homePathForRole(role)
}

const HANDOFF_PLAN_IDS = new Set(['free', 'eko', 'diyet', 'spor', 'doktor', 'vip'])

/**
 * Mobil ödeme CTA: yalnız /plans (opsiyonel ?plan= id).
 * Harici URL / // / bozuk next → null (kör navigate yok).
 */
export function parseMobileHandoffNext(raw) {
  if (!raw || typeof raw !== 'string') return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    decoded = raw
  }
  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return null
  const qIndex = decoded.indexOf('?')
  const path = qIndex === -1 ? decoded : decoded.slice(0, qIndex)
  if (path !== '/plans') return null
  if (qIndex === -1) return '/plans'
  const params = new URLSearchParams(decoded.slice(qIndex + 1))
  const plan = params.get('plan')
  if (plan && HANDOFF_PLAN_IDS.has(plan)) {
    return `/plans?plan=${encodeURIComponent(plan)}`
  }
  return '/plans'
}

export function isMobileCheckoutHandoff(params) {
  if (!params || typeof params.get !== 'function') return false
  if (params.get('src') === 'mobile') return true
  return Boolean(parseMobileHandoffNext(params.get('next')))
}
