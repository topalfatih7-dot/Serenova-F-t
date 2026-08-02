export const MEMBER_DISPLAY_FLOOR = 0
export const ONLINE_DISPLAY_FLOOR = 0
export const ONLINE_DISPLAY_MIN = 0
export const ONLINE_DISPLAY_MAX = 0

export function pickSessionOnlineBoost() {
  return 0
}

/** Gerçek üye sayısını gösterir (sahte floor yok). */
export function getDisplayMemberCount(actual) {
  const count = Math.max(0, actual ?? 0)
  return { value: count, showPlus: false }
}

/** Gerçek çevrimiçi sayısını gösterir. */
export function getDisplayOnlineCount(actual) {
  return Math.max(0, actual ?? 0)
}
