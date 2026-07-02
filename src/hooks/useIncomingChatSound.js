import { useEffect } from 'react'
import { useApp } from '../context/AppContext'
import {
  isNotificationSoundEnabled,
  playNotificationSound,
  unlockNotificationAudio,
} from '../utils/browserNotifications'

const seenMessageIds = new Map()
const bootstrappedUsers = new Set()

function getSeenSet(userId) {
  if (!userId) return new Set()
  if (!seenMessageIds.has(userId)) seenMessageIds.set(userId, new Set())
  return seenMessageIds.get(userId)
}

/**
 * Realtime ile gelen yeni sohbet mesajlarında bildirim sesi.
 * members.notifications güncellemesinden bağımsız — doğrudan chat_messages INSERT dinler.
 */
export default function useIncomingChatSound({ enabled = true } = {}) {
  const { chatMessages, isAuthenticated, isStaff, settings, user, staffUser } = useApp()
  const userId = isStaff ? staffUser?.id : user?.id
  const incomingSenderType = isStaff ? 'member' : 'staff'

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId || !isNotificationSoundEnabled(settings)) return
    if (isStaff && !staffUser?.id) return

    const seen = getSeenSet(userId)
    const allMessages = Object.values(chatMessages || {}).flat()

    if (!bootstrappedUsers.has(userId)) {
      allMessages.forEach((m) => seen.add(m.id))
      bootstrappedUsers.add(userId)
      return
    }

    allMessages.forEach((m) => {
      if (seen.has(m.id)) return
      seen.add(m.id)
      if (m.senderType !== incomingSenderType || m.senderType === 'system') return

      unlockNotificationAudio()
        .finally(() => playNotificationSound().catch(() => {}))
    })
  }, [enabled, chatMessages, isAuthenticated, isStaff, settings, userId, staffUser?.id, incomingSenderType])
}
