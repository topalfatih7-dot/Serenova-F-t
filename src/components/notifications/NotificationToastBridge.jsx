import useNotificationAlerts from '../../hooks/useNotificationAlerts'
import useIncomingChatSound from '../../hooks/useIncomingChatSound'

/** Realtime ile gelen yeni bildirimleri toast, ses ve tarayıcı bildirimi olarak gösterir. */
export default function NotificationToastBridge() {
  useNotificationAlerts()
  useIncomingChatSound()
  return null
}
