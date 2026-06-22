export const MEMBER_DISPLAY_FLOOR = 1250
export const ONLINE_DISPLAY_FLOOR = 25
export const ONLINE_DISPLAY_MIN = 16
export const ONLINE_DISPLAY_MAX = 25

export function pickSessionOnlineBoost() {
  return Math.floor(Math.random() * (ONLINE_DISPLAY_MAX - ONLINE_DISPLAY_MIN + 1)) + ONLINE_DISPLAY_MIN
}

/** Gerçek üye sayısı 1250'nin altındaysa 1250+ göster; üstündeyse gerçek sayı. */
export function getDisplayMemberCount(actual) {
  const count = actual ?? 0
  if (count < MEMBER_DISPLAY_FLOOR) {
    return { value: MEMBER_DISPLAY_FLOOR, showPlus: true }
  }
  return { value: count, showPlus: false }
}

/** Aktif kullanıcı 25'ten azsa oturum boyunca 16–25 arası sabit rastgele sayı. */
export function getDisplayOnlineCount(actual, sessionBoost) {
  const count = actual ?? 0
  if (count >= ONLINE_DISPLAY_FLOOR) return count
  return sessionBoost
}
