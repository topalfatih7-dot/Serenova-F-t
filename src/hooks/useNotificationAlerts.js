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

const TOAST_BY_TYPE = {
  program: 'success',
  assignment: 'success',
  'support-reply': 'info',
  chat: 'info',
  reminder: 'info',
  availability: 'info',
  appointment: 'info',
}

/** Oturum boyunca görülen bildirim id'leri — Strict Mode çift mount'ta tekrar ses çıkmaz. */
const seenByUser = new Map()
const bootstrappedUsers = new Set()
const SEEN_ID_CAP = 1000

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
}

function notificationBody(n) {
  return n.message || n.text || ''
}

function isViewingChatNotification(n, pathname) {
  if (n.type !== 'chat') return false
  if (n.staffRole && pathname === `/messages/${n.staffRole}`) return true
  if (n.threadId && pathname.startsWith('/messages/')) return true
  return false
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
  const { notifications, isAuthenticated, settings, user, loading } = useApp()
  const { toast } = useToast()
  const location = useLocation()
  const permissionRequestedRef = useRef(false)
  const userId = user?.id

  useEffect(() => {
    if (!isAuthenticated) {
      permissionRequestedRef.current = false
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!enabled || !isAuthenticated || !isPushNotificationEnabled(settings)) return
    if (permissionRequestedRef.current) return
    if (getNotificationPermission() !== 'default') return

    permissionRequestedRef.current = true
    requestNotificationPermission().catch(() => {})
  }, [enabled, isAuthenticated, settings])

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) return
    // Hydrate bitmeden bootstrap etme — boş listeyi "geçmiş" sayıp sonraki dolu listeyi
    // yeni bildirim sanmayı önler (kayıt / yavaş üye yüklemesi).
    if (loading) return

    const seen = getSeenSet(userId)
    const list = notifications || []

    if (!bootstrappedUsers.has(userId)) {
      bootstrappedUsers.add(userId)
      list.forEach((n) => addSeen(seen, n.id))
      return
    }

    const pushEnabled = isPushNotificationEnabled(settings)
    const soundEnabled = isNotificationSoundEnabled(settings)
    const remindersEnabled = isReminderNotificationsEnabled(settings)

    list.forEach((n) => {
      if (!n?.id || seen.has(n.id)) return
      addSeen(seen, n.id)
      if (n.read) return

      if ((n.type === 'reminder' || n.type === 'availability') && !remindersEnabled) return

      // Kullanıcı o sohbeti zaten açık görüntülüyorsa uyarıya gerek yok.
      if (isViewingChatNotification(n, location.pathname)) return

      const body = notificationBody(n)
      const variant = TOAST_BY_TYPE[n.type] || 'info'
      toast(body ? `${n.title}: ${body}` : n.title, variant)

      // Chat sesi sohbet hook'unda; burada yalnızca program / randevu vb.
      if (soundEnabled && n.type !== 'chat') {
        playNotificationSoundThrottled().catch(() => {})
      }

      if (pushEnabled) {
        showBrowserNotification(n.title, { body, tag: `yf-${n.type}-${n.id}` })
      }
    })
  }, [enabled, notifications, isAuthenticated, toast, settings, userId, location.pathname, loading])
}
