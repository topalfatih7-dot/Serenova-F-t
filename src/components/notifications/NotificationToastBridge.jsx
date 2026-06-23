import { useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext'
import { useToast } from '../../context/ToastContext'

const TOAST_BY_TYPE = {
  program: 'success',
  assignment: 'success',
  'support-reply': 'info',
  reminder: 'info',
  appointment: 'info',
}

function notificationBody(n) {
  return n.message || n.text || ''
}

/**
 * Realtime ile gelen yeni bildirimleri toast olarak gösterir.
 * Sayfa yenilemeden çalışır (member UPDATE → AppContext).
 */
export default function NotificationToastBridge() {
  const { notifications, isAuthenticated, membership } = useApp()
  const { toast } = useToast()
  const seenRef = useRef(new Set())
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!isAuthenticated) {
      bootstrappedRef.current = false
      seenRef.current = new Set()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !notifications?.length) return

    if (!bootstrappedRef.current) {
      notifications.forEach((n) => seenRef.current.add(n.id))
      bootstrappedRef.current = true
      return
    }

    notifications.forEach((n) => {
      if (seenRef.current.has(n.id)) return
      seenRef.current.add(n.id)
      if (n.read) return
      const body = notificationBody(n)
      const variant = TOAST_BY_TYPE[n.type] || 'info'
      toast(body ? `${n.title}: ${body}` : n.title, variant)
    })
  }, [notifications, isAuthenticated, toast, membership])

  return null
}
