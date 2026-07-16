const SOUND_URL = '/sounds/notification.wav'
/** Wellness / koçluk paneli — yumuşak, dikkat dağıtmayan seviye */
const DEFAULT_VOLUME = 0.42
const SOUND_THROTTLE_MS = 1400

let audioTemplate = null
let unlocked = false
let unlockPromise = null
let audioCtx = null
let lastSoundAt = 0

function canUseAudio() {
  return typeof window !== 'undefined'
}

function getAudioTemplate() {
  if (!canUseAudio()) return null
  if (!audioTemplate) {
    audioTemplate = new Audio(SOUND_URL)
    audioTemplate.preload = 'auto'
    audioTemplate.volume = 0
  }
  return audioTemplate
}

/** Tarayıcı autoplay kilidini kullanıcı etkileşimiyle açar (duyulmaz). */
export function unlockNotificationAudio() {
  if (!canUseAudio()) return Promise.resolve(false)
  if (unlocked) return Promise.resolve(true)
  if (unlockPromise) return unlockPromise

  unlockPromise = (async () => {
    const template = getAudioTemplate()
    if (!template) return false

    try {
      template.muted = true
      template.volume = 0
      template.currentTime = 0
      await template.play()
      template.pause()
      template.currentTime = 0
      template.muted = false
      template.volume = DEFAULT_VOLUME
      unlocked = true
      return true
    } catch {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext
        if (Ctx) {
          audioCtx = audioCtx || new Ctx()
          if (audioCtx.state === 'suspended') await audioCtx.resume()
          unlocked = audioCtx.state === 'running'
          return unlocked
        }
      } catch {
        /* yoksay */
      }
      return false
    } finally {
      unlockPromise = null
    }
  })()

  return unlockPromise
}

export function isNotificationAudioUnlocked() {
  return unlocked
}

async function playWebAudioTone() {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) return false
  audioCtx = audioCtx || new Ctx()
  if (audioCtx.state === 'suspended') await audioCtx.resume()
  if (audioCtx.state !== 'running') return false

  const t0 = audioCtx.currentTime
  // Daha yumuşak çift ton (A5 → C#6 yerine daha alçak, kısa)
  ;[698.46, 880].forEach((freq, i) => {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t0 + i * 0.1)
    gain.gain.exponentialRampToValueAtTime(0.045, t0 + i * 0.1 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.1 + 0.16)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(t0 + i * 0.1)
    osc.stop(t0 + i * 0.1 + 0.18)
  })
  return true
}

/** Bildirim sesi — HTML5 Audio (birincil), Web Audio yedek. */
export async function playNotificationSound() {
  if (!canUseAudio()) return false

  const playClip = async () => {
    const clip = new Audio(SOUND_URL)
    clip.preload = 'auto'
    clip.volume = DEFAULT_VOLUME
    clip.currentTime = 0
    await clip.play()
    return true
  }

  try {
    await playClip()
    unlocked = true
    return true
  } catch {
    if (!unlocked) {
      const ok = await unlockNotificationAudio()
      if (ok) {
        try {
          await playClip()
          return true
        } catch {
          /* Web Audio yedeğine düş */
        }
      }
    }
  }

  try {
    const ok = await playWebAudioTone()
    if (ok) unlocked = true
    return ok
  } catch {
    return false
  }
}

/** Ardışık bildirimlerde tek ses (program + mesaj aynı anda vb.). */
export async function playNotificationSoundThrottled() {
  const now = Date.now()
  if (now - lastSoundAt < SOUND_THROTTLE_MS) return false
  lastSoundAt = now
  return playNotificationSound()
}

export function getNotificationPermission() {
  if (!canUseAudio() || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission() {
  if (!canUseAudio() || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  if (Notification.permission === 'denied') return 'denied'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function showBrowserNotification(title, options = {}) {
  if (!canUseAudio() || !('Notification' in window)) return false
  if (Notification.permission !== 'granted') return false
  if (document.visibilityState === 'visible' && document.hasFocus()) return false

  try {
    const n = new Notification(title, {
      body: options.body || '',
      icon: options.icon || '/brand-mark.png',
      badge: '/brand-mark.png',
      tag: options.tag || 'yeniform-notification',
      renotify: false,
    })
    n.onclick = () => {
      window.focus()
      n.close()
      options.onClick?.()
    }
    return true
  } catch {
    return false
  }
}

export function isNotificationSoundEnabled(settings) {
  return settings?.soundNotifs !== false
}

export function isPushNotificationEnabled(settings) {
  return settings?.pushNotifs !== false
}

export function isReminderNotificationsEnabled(settings) {
  return settings?.reminderNotifs !== false
}
