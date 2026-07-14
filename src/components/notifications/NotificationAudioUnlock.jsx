import { useEffect, useState } from 'react'
import { isNotificationAudioUnlocked, unlockNotificationAudio } from '../../utils/browserNotifications'

function scheduleIdle(fn, timeoutMs = 3000) {
  if (typeof window === 'undefined') return () => {}
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(fn, { timeout: timeoutMs })
    return () => window.cancelIdleCallback?.(id)
  }
  const id = window.setTimeout(fn, Math.min(timeoutMs, 1500))
  return () => window.clearTimeout(id)
}

/** Kullanıcı etkileşimiyle bildirim sesi kilidini açar (autoplay policy).
 *  Dinleyiciler idle/ilk etkileşim sonrası bağlanır — ilk boyamayı bloklamaz. */
export default function NotificationAudioUnlock() {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const arm = () => { if (!cancelled) setArmed(true) }
    const cancelIdle = scheduleIdle(arm)
    const onInteract = () => arm()
    window.addEventListener('pointerdown', onInteract, { once: true, passive: true })
    window.addEventListener('keydown', onInteract, { once: true })
    window.addEventListener('touchstart', onInteract, { once: true, passive: true })
    return () => {
      cancelled = true
      cancelIdle()
      window.removeEventListener('pointerdown', onInteract)
      window.removeEventListener('keydown', onInteract)
      window.removeEventListener('touchstart', onInteract)
    }
  }, [])

  useEffect(() => {
    if (!armed) return undefined

    const unlock = () => {
      if (isNotificationAudioUnlocked()) return
      unlockNotificationAudio().catch(() => {})
    }

    // İlk etkileşim zaten arm ettiyse hemen dene; sonraki etkileşimlerde de aç.
    unlock()

    window.addEventListener('pointerdown', unlock, { passive: true })
    window.addEventListener('keydown', unlock)
    window.addEventListener('touchstart', unlock, { passive: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [armed])

  return null
}
