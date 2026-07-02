import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
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
  availability: 'info',
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
 *
 * Kurallar:
 * - Girişteki mevcut bildirimler (okunmuş/okunmamış) hiçbir zaman uyarı üretmez;
 *   yalnızca oturum sırasında GELEN bildirimler uyarır (rozetler ayrıca çalışır).
 * - Kullanıcı ilgili sohbeti o an görüntülüyorsa chat bildirimi gösterilmez.
 * - Chat tipinde ses useIncomingChatSound tarafından yönetilir (çift ses olmaz).
 */
export default function useNotificationAlerts({ enabled = true } = {}) {
  const { notifications, isAuthenticated, settings, user } = useApp()
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

    const seen = getSeenSet(userId)
    const list = notifications || []

    // İlk yükleme: mevcut bildirimler geçmiştir — boş liste de bootstrap sayılır,
    // aksi halde ilk gelen bildirim sessizce yutulur.
    if (!bootstrappedUsers.has(userId)) {
      bootstrappedUsers.add(userId)
      list.forEach((n) => seen.add(n.id))
      return
    }

    const pushEnabled = isPushNotificationEnabled(settings)
    const soundEnabled = isNotificationSoundEnabled(settings)

    list.forEach((n) => {
      if (seen.has(n.id)) return
      seen.add(n.id)
      if (n.read) return

      // Kullanıcı o sohbeti zaten açık görüntülüyorsa uyarıya gerek yok.
      if (n.type === 'chat' && n.staffRole && location.pathname === `/messages/${n.staffRole}`) return

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
  }, [enabled, notifications, isAuthenticated, toast, settings, userId, location.pathname])
}
