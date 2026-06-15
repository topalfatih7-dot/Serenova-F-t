const REMEMBER_KEY = 'nf-remember-me'

function supabaseAuthKeys(storage) {
  return Object.keys(storage).filter((key) => key.startsWith('sb-') && key.includes('auth-token'))
}

export function getRememberMe() {
  return localStorage.getItem(REMEMBER_KEY) === '1'
}

export function setRememberMe(remember) {
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, '1')
    return
  }
  localStorage.removeItem(REMEMBER_KEY)
  supabaseAuthKeys(localStorage).forEach((key) => localStorage.removeItem(key))
}

export function clearAllAuthTokens() {
  supabaseAuthKeys(localStorage).forEach((key) => localStorage.removeItem(key))
  supabaseAuthKeys(sessionStorage).forEach((key) => sessionStorage.removeItem(key))
}

function activeStorage() {
  return getRememberMe() ? localStorage : sessionStorage
}

/** Supabase auth için "Beni hatırla" tercihine göre depolama seçer. */
export const authStorage = {
  getItem(key) {
    return activeStorage().getItem(key)
  },
  setItem(key, value) {
    const target = activeStorage()
    const other = target === localStorage ? sessionStorage : localStorage
    other.removeItem(key)
    target.setItem(key, value)
  },
  removeItem(key) {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}
