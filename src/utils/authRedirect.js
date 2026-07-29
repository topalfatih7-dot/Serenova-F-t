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
