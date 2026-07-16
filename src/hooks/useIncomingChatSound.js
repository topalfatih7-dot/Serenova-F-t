import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import {
  isNotificationSoundEnabled,
  playNotificationSoundThrottled,
} from '../utils/browserNotifications'

/** userId -> Set(messageId): ses değerlendirmesi yapılmış mesajlar. */
const seenMessagesByUser = new Map()
const bootstrappedUsers = new Set()

/** Uzun oturumda sınırsız büyümeyi önler (bellek). */
const SEEN_ID_CAP = 1000

function getSeenSet(userId) {
  if (!seenMessagesByUser.has(userId)) seenMessagesByUser.set(userId, new Set())
  return seenMessagesByUser.get(userId)
}

function addSeen(set, id) {
  if (!id) return
  set.add(id)
  if (set.size <= SEEN_ID_CAP) return
  const oldest = set.values().next().value
  set.delete(oldest)
}

function collectMessageIds(chatMessages) {
  const ids = []
  Object.values(chatMessages || {}).forEach((list) => {
    ;(list || []).forEach((m) => {
      if (m?.id) ids.push(m.id)
    })
  })
  return ids
}

/** Açık sohbet görünürken ses çalma (üye veya personel). */
function isViewingThread(pathname, thread, threadsById, threadId, isStaff) {
  if (!pathname) return false
  if (isStaff) {
    const match = pathname.match(/^\/staff\/messages\/([^/]+)/)
    if (!match) return false
    const openMemberId = match[1]
    const resolved = thread || threadsById.get(threadId)
    if (resolved?.memberId) return String(resolved.memberId) === String(openMemberId)
    return false
  }
  const role = thread?.staffRole || threadsById.get(threadId)?.staffRole
  if (role) return pathname === `/messages/${role}`
  return false
}

/** Logout sonrası bellek temizliği — tekrar login'de bootstrap sessiz kalır. */
export function clearIncomingChatSoundState() {
  seenMessagesByUser.clear()
  bootstrappedUsers.clear()
}

/**
 * Gelen sohbet mesajlarında bildirim sesi (realtime/poll fark etmez).
 *
 * Kurallar:
 * - Oturumun ilk anındaki tüm mesajlar geçmiş kabul edilir (sessiz bootstrap).
 * - Sonra yalnızca yeni gelen, karşı taraftan mesajlar ses çıkarır.
 * - Kullanıcı ilgili sohbeti açık görüntülüyorsa ses yok.
 * - Aynı anda birden çok mesaj → tek ses (throttle).
 */
export default function useIncomingChatSound({ enabled = true } = {}) {
  const { chatMessages, chatThreads, isAuthenticated, isStaff, settings, user, staffUser } = useApp()
  const location = useLocation()
  const userId = isStaff ? staffUser?.id : user?.id
  const incomingSenderType = isStaff ? 'member' : 'staff'

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) return

    const seen = getSeenSet(userId)
    const threadsById = new Map((chatThreads || []).map((t) => [t.id, t]))

    if (!bootstrappedUsers.has(userId)) {
      bootstrappedUsers.add(userId)
      collectMessageIds(chatMessages).forEach((id) => addSeen(seen, id))
      return
    }

    if (!isNotificationSoundEnabled(settings)) {
      collectMessageIds(chatMessages).forEach((id) => addSeen(seen, id))
      return
    }

    let hasNewIncoming = false

    Object.entries(chatMessages || {}).forEach(([threadId, list]) => {
      const thread = threadsById.get(threadId)
      const viewing = isViewingThread(location.pathname, thread, threadsById, threadId, isStaff)

      ;(list || []).forEach((m) => {
        if (!m?.id || seen.has(m.id)) return
        addSeen(seen, m.id)
        if (viewing) return
        if (m.senderType !== incomingSenderType) return
        hasNewIncoming = true
      })
    })

    if (hasNewIncoming) {
      playNotificationSoundThrottled().catch(() => {})
    }
  }, [
    enabled,
    chatMessages,
    chatThreads,
    isAuthenticated,
    settings,
    userId,
    incomingSenderType,
    isStaff,
    location.pathname,
  ])
}
