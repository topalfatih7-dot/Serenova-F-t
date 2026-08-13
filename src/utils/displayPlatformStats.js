/**
 * KİLİTLİ ÜRÜN KARARI (2026-08-13) — asla değiştirme / geri alma.
 * SoT: .cursor/rules/platform-display-stats-locked.mdc
 *
 * Toplam üye < 750 → 750+; ≥ 750 → gerçek sayı.
 * Çevrimiçi < 20 → oturumda sabit 20–25 rastgele; ≥ 20 → gerçek sayı.
 */
export const MEMBER_DISPLAY_FLOOR = 750
export const ONLINE_DISPLAY_FLOOR = 20
export const ONLINE_DISPLAY_MIN = 20
export const ONLINE_DISPLAY_MAX = 25

const SESSION_KEY = 'yf.onlineDisplayBoost'

function rollOnlineBoost() {
  return Math.floor(Math.random() * (ONLINE_DISPLAY_MAX - ONLINE_DISPLAY_MIN + 1)) + ONLINE_DISPLAY_MIN
}

/** Oturum boyunca aynı 20–25 değerini döner (SSR’de MIN). */
export function pickSessionOnlineBoost() {
  if (typeof sessionStorage === 'undefined') return ONLINE_DISPLAY_MIN

  try {
    const stored = Number(sessionStorage.getItem(SESSION_KEY))
    if (Number.isInteger(stored) && stored >= ONLINE_DISPLAY_MIN && stored <= ONLINE_DISPLAY_MAX) {
      return stored
    }
    const next = rollOnlineBoost()
    sessionStorage.setItem(SESSION_KEY, String(next))
    return next
  } catch {
    return rollOnlineBoost()
  }
}

/** Gerçek üye sayısı 750'nin altındaysa 750+; üstündeyse veya eşitse gerçek sayı. */
export function getDisplayMemberCount(actual) {
  const count = actual ?? 0
  if (count < MEMBER_DISPLAY_FLOOR) {
    return { value: MEMBER_DISPLAY_FLOOR, showPlus: true }
  }
  return { value: count, showPlus: false }
}

/** Çevrimiçi 20'den azsa oturum boyunca 20–25; 20 ve üzeri gerçek sayı. */
export function getDisplayOnlineCount(actual, sessionBoost) {
  const count = actual ?? 0
  if (count >= ONLINE_DISPLAY_FLOOR) return count
  return sessionBoost ?? ONLINE_DISPLAY_MIN
}
