import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'
import {
  getNotificationPermission,
  isNotificationSoundEnabled,
  isPushNotificationEnabled,
  playNotificationSound,
  requestNotificationPermission,
  showBrowserNotification,
} from '../utils/browserNotifications'

const TOAST_BY_TYPE = {
  program: 'success',
  assignment: 'success',
  'support-reply': 'info',
  chat: 'info',
  reminder: 'info',
  appointment: 'info',
}

/** Oturum boyunca görülen bildirim id'leri — Strict Mode çift mount'ta tekrar ses çıkmaz. */
const seenByUser = new Map()
const bootstrappedUsers = new Set()

function getSeenSet(userId) {
  if (!userId) return new Set()
  if (!seenByUser.has(userId)) seenByUser.set(userId, new Set())
  return seenByUser.get(userId)
}

function notificationBody(n) {
  return n.message || n.text || ''
}

/**
 * Yeni bildirimleri algılar; toast, ses ve tarayıcı bildirimi tetikler.
 * Tüm üye panelinde (NotificationsPage dahil) App seviyesinde çalışır.
 */
export default function useNotificationAlerts({ enabled = true } = {}) {
  const { notifications, isAuthenticated, settings, user } = useApp()
  const { toast } = useToast()
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
    if (!enabled || !isAuthenticated || !userId || !notifications?.length) return

    const seen = getSeenSet(userId)

    if (!bootstrappedUsers.has(userId)) {
      notifications.forEach((n) => seen.add(n.id))
      bootstrappedUsers.add(userId)
      return
    }

    const pushEnabled = isPushNotificationEnabled(settings)
    const soundEnabled = isNotificationSoundEnabled(settings)

    notifications.forEach((n) => {
      if (seen.has(n.id)) return
      seen.add(n.id)
      if (n.read) return

      const body = notificationBody(n)
      const variant = TOAST_BY_TYPE[n.type] || 'info'
      toast(body ? `${n.title}: ${body}` : n.title, variant)

      if (soundEnabled && n.type !== 'chat') {
        playNotificationSound().catch(() => {})
      }

      if (pushEnabled) {
        showBrowserNotification(n.title, { body })
      }
    })
  }, [enabled, notifications, isAuthenticated, toast, settings, userId])
}
