import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  getNotificationPermission,
  isNotificationSoundEnabled,
  isPushNotificationEnabled,
  isReminderNotificationsEnabled,
  playNotificationSoundThrottled,
  requestNotificationPermission,
  showBrowserNotification,
} from '../utils/browserNotifications'
import { chatAlertDedupeKey, isViewingChatNotification } from '../utils/notificationRead'

const TOAST_BY_TYPE = {
  program: 'success',
  assignment: 'success',
  'support-reply': 'info',
  chat: 'info',
  reminder: 'info',
  availability: 'info',
  appointment: 'info',
  billing: 'info',
}

/** Oturum boyunca görülen bildirim id'leri — Strict Mode çift mount'ta tekrar ses çıkmaz. */
const seenByUser = new Map()
const bootstrappedUsers = new Set()
const SEEN_ID_CAP = 1000
const CHAT_ALERT_DEDUPE_MS = 4000
const recentChatAlertAt = new Map()

function getSeenSet(userId) {
  if (!userId) return new Set()
  if (!seenByUser.has(userId)) seenByUser.set(userId, new Set())
  return seenByUser.get(userId)
}

function addSeen(set, id) {
  if (!id) return
  set.add(id)
  if (set.size <= SEEN_ID_CAP) return
  const oldest = set.values().next().value
  set.delete(oldest)
}

/** Logout sonrası bellek temizliği — tekrar login'de bootstrap sessiz kalır. */
export function clearNotificationAlertState() {
  seenByUser.clear()
  bootstrappedUsers.clear()
  recentChatAlertAt.clear()
}

function notificationBody(n) {
  return n.message || n.text || ''
}

function takeChatAlertSlot(n) {
  const key = chatAlertDedupeKey(n)
  if (!key) return true
  const now = Date.now()
  const last = recentChatAlertAt.get(key) || 0
  if (now - last < CHAT_ALERT_DEDUPE_MS) return false
  recentChatAlertAt.set(key, now)
  if (recentChatAlertAt.size <= 200) return true
  const oldest = recentChatAlertAt.keys().next().value
  recentChatAlertAt.delete(oldest)
  return true
}

function toastText(n) {
  if (n.type === 'chat') return n.title || 'Yeni mesaj'
  const body = notificationBody(n)
  return body ? `${n.title}: ${body}` : n.title
}

/**
 * Yeni bildirimleri algılar; toast, ses ve tarayıcı bildirimi tetikler.
 *
 * Kurallar:
 * - Girişteki mevcut bildirimler (okunmuş/okunmamış) hiçbir zaman uyarı üretmez;
 *   yalnızca oturum sırasında GELEN bildirimler uyarır (rozetler ayrıca çalışır).
 * - Kullanıcı ilgili sohbeti o an görüntülüyorsa chat bildirimi gösterilmez.
 * - Chat tipinde ses useIncomingChatSound tarafından yönetilir (çift ses olmaz).
 * - Hatırlatıcılar `reminderNotifs` kapalıysa tamamen sessiz.
 */
export default function useNotificationAlerts({ enabled = true } = {}) {
  const { notifications, isAuthenticated, settings, user, staffUser, isStaff, loading } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const permissionRequestedRef = useRef(false)
  const userId = isStaff ? staffUser?.id : user?.id
  // Auth stub {id,name,email} — notifications yok. Üye/personel satırı gelince Array.isArray true.
  const profileReady = isStaff
    ? Array.isArray(staffUser?.notifications)
    : Array.isArray(user?.notifications)

  const pushEnabled = isPushNotificationEnabled(settings)
  const soundEnabled = isNotificationSoundEnabled(settings)
  const remindersEnabled = isReminderNotificationsEnabled(settings)

  useEffect(() => {
    if (!isAuthenticated) {
      permissionRequestedRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!enabled || !isAuthenticated || !pushEnabled) return
    if (permissionRequestedRef.current) return
    if (getNotificationPermission() !== 'default') return

    permissionRequestedRef.current = true
    requestNotificationPermission().catch(() => {})
  }, [enabled, isAuthenticated, pushEnabled])

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) return
    // Hydrate bitmeden / üye kaydı gelmeden bootstrap etme — boş listeyi "geçmiş"
    // sayıp sonraki dolu listeyi yeni bildirim sanmayı önler.
    if (loading || !profileReady) return

    const seen = getSeenSet(userId)
    const list = Array.isArray(notifications) ? notifications : []

    if (!bootstrappedUsers.has(userId)) {
      bootstrappedUsers.add(userId)
      list.forEach((n) => addSeen(seen, n.id))
      return
    }

    list.forEach((n) => {
      if (!n?.id || seen.has(n.id)) return
      addSeen(seen, n.id)
      if (n.read) return

      if ((n.type === 'reminder' || n.type === 'availability') && !remindersEnabled) return

      // Kullanıcı o sohbeti zaten açık görüntülüyorsa uyarıya gerek yok.
      if (isViewingChatNotification(n, location.pathname)) return
      if (n.type === 'chat' && !takeChatAlertSlot(n)) return

      const variant = TOAST_BY_TYPE[n.type] || 'info'
      toast(toastText(n), variant, 5000)

      // Chat sesi sohbet hook'unda; burada yalnızca program / randevu vb.
      if (soundEnabled && n.type !== 'chat') {
        playNotificationSoundThrottled().catch(() => {})
      }

      if (pushEnabled) {
        const tag = n.type === 'chat' && (n.threadId || n.memberId)
          ? `yf-chat-${n.threadId || n.memberId}`
          : `yf-${n.type}-${n.id}`
        showBrowserNotification(n.title, { body: notificationBody(n), tag })
      }
    })
  }, [
    enabled,
    notifications,
    isAuthenticated,
    toast,
    userId,
    location.pathname,
    loading,
    profileReady,
    pushEnabled,
    soundEnabled,
    remindersEnabled,
  ])
}
