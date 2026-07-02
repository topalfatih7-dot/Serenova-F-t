import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import { isNotificationSoundEnabled, playNotificationSound } from '../utils/browserNotifications'

/** Sayfa açılış anı — daha eski mesajlar hiçbir zaman "yeni" sayılmaz. */
const PAGE_LOADED_AT = Date.now()

/** userId -> Set(threadId): mesajları en az bir kez yüklenen sohbetler. */
const seenThreadsByUser = new Map()
/** userId -> Set(messageId): ses değerlendirmesi yapılmış mesajlar. */
const seenMessagesByUser = new Map()

function getSet(map, userId) {
  if (!map.has(userId)) map.set(userId, new Set())
  return map.get(userId)
}

/**
 * Gelen sohbet mesajlarında bildirim sesi (realtime/poll fark etmez).
 *
 * Kurallar (yanlış alarm olmaması için):
 * - Bir sohbetin İLK yüklemesi geçmiş kabul edilir; sessizce işaretlenir.
 *   (Sayfa yenilenip sohbete girince geçmiş mesajlar ses çıkarmaz.)
 * - Sayfa açılışından önce yazılmış mesajlar yeni sayılmaz.
 * - Kullanıcının kendi gönderdiği mesajlar ses çıkarmaz.
 * - Aynı anda gelen birden çok mesaj için tek ses çalınır.
 */
export default function useIncomingChatSound({ enabled = true } = {}) {
  const { chatMessages, isAuthenticated, isStaff, settings, user, staffUser } = useApp()
  const userId = isStaff ? staffUser?.id : user?.id
  const incomingSenderType = isStaff ? 'member' : 'staff'

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) return

    const seenThreads = getSet(seenThreadsByUser, userId)
    const seenMessages = getSet(seenMessagesByUser, userId)
    let hasNewIncoming = false

    Object.entries(chatMessages || {}).forEach(([threadId, list]) => {
      const isFirstLoad = !seenThreads.has(threadId)
      seenThreads.add(threadId)

      ;(list || []).forEach((m) => {
        if (seenMessages.has(m.id)) return
        seenMessages.add(m.id)
        if (isFirstLoad) return
        if (m.senderType !== incomingSenderType) return
        if (new Date(m.createdAt).getTime() <= PAGE_LOADED_AT) return
        hasNewIncoming = true
      })
    })

    if (hasNewIncoming && isNotificationSoundEnabled(settings)) {
      playNotificationSound().catch(() => {})
    }
  }, [enabled, chatMessages, isAuthenticated, settings, userId, incomingSenderType])
}
