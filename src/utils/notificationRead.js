/** Bildirim okundu bayrakları tek yönlüdür: yerel `read:true` uzak `false` üzerine yazılmaz. */
export function mergeNotificationLists(incoming = [], local = []) {
  const localById = new Map()
  for (const n of local || []) {
    if (n?.id) localById.set(n.id, n)
  }
  return (incoming || []).map((n) => {
    if (!n?.id) return n
    const loc = localById.get(n.id)
    if (loc?.read && !n.read) return { ...n, read: true }
    return n
  })
}

export function markNotificationsReadInList(list = [], { ids = null, all = false } = {}) {
  if (!Array.isArray(list) || list.length === 0) return list
  if (all) return list.map((n) => (n.read ? n : { ...n, read: true }))
  if (!ids?.length) return list
  const set = new Set(ids)
  return list.map((n) => (n?.id && set.has(n.id) && !n.read ? { ...n, read: true } : n))
}

/** Açık sohbetle eşleşen okunmamış chat bildirimleri. */
export function relatedChatNotificationIds(list = [], { threadId, staffRole, memberId } = {}) {
  return (list || [])
    .filter((n) => {
      if (!n || n.read || n.type !== 'chat') return false
      if (threadId && n.threadId && String(n.threadId) === String(threadId)) return true
      if (memberId && n.memberId && String(n.memberId) === String(memberId)) return true
      if (staffRole && n.staffRole && n.staffRole === staffRole) return true
      return false
    })
    .map((n) => n.id)
    .filter(Boolean)
}

/**
 * Kullanıcı bu sohbeti ekranda açık görüntülüyorsa toast/push gereksiz.
 * Üye: /messages/:staffRole  —  Personel: /staff/messages/:memberId
 */
export function isViewingChatNotification(n, pathname) {
  if (!n || n.type !== 'chat' || !pathname) return false
  if (n.staffRole && pathname === `/messages/${n.staffRole}`) return true
  const staffMatch = pathname.match(/^\/staff\/messages\/([^/?#]+)/)
  if (!staffMatch) return false
  const openMemberId = staffMatch[1]
  return Boolean(n.memberId && String(n.memberId) === String(openMemberId))
}

/** Aynı sohbet için peş peşe gelen çift kaydı (istemci + Expo) tek uyarıya indirir. */
export function chatAlertDedupeKey(n) {
  if (!n || n.type !== 'chat') return n?.id || ''
  return String(n.threadId || n.memberId || n.id || '')
}
