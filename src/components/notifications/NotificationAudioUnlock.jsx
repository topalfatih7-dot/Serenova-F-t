import { useEffect } from 'react'
import { isNotificationAudioUnlocked, unlockNotificationAudio } from '../../utils/browserNotifications'

/** Kullanıcı etkileşimiyle bildirim sesi kilidini açar (autoplay policy). */
export default function NotificationAudioUnlock() {
  useEffect(() => {
    const unlock = () => {
      if (isNotificationAudioUnlocked()) return
      unlockNotificationAudio().catch(() => {})
    }

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    window.addEventListener('touchstart', unlock, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  return null
}
