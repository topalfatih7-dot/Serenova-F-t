import { useLayoutEffect, useRef } from 'react'

export const NEAR_BOTTOM_PX = 140

/**
 * Yeni balon scrollHeight'i büyütünce tarayıcı scroll olayı basabilir.
 * O anda dist > eşik olur; bunu "kullanıcı yukarı çıktı" sanırsak alta kilit düşer.
 */
export function shouldKeepChatStuckToBottom({
  distanceFromBottom,
  nearPx = NEAR_BOTTOM_PX,
  heightGrew,
  currentlySticking,
}) {
  if (distanceFromBottom < nearPx) return true
  if (heightGrew) return currentlySticking
  return false
}

/**
 * Sohbet listesini alta kilitler. smooth scroll kullanmaz — uzun geçmişte
 * tepeye sıfırlanıp tüm mesajların üzerinden kaymak "yukarı-aşağı zıplama" yapar.
 */
export default function useStickChatToBottom(messages) {
  const scrollRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const lastHeightRef = useRef(0)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
    lastHeightRef.current = el.scrollHeight
  }, [messages])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const heightGrew = el.scrollHeight > lastHeightRef.current + 1
    lastHeightRef.current = el.scrollHeight
    stickToBottomRef.current = shouldKeepChatStuckToBottom({
      distanceFromBottom,
      heightGrew,
      currentlySticking: stickToBottomRef.current,
    })
  }

  return { scrollRef, onScroll }
}
