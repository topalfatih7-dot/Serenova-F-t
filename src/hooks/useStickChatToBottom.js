import { useLayoutEffect, useRef } from 'react'

const NEAR_BOTTOM_PX = 140

/**
 * Sohbet listesini alta kilitler. smooth scroll kullanmaz — uzun geçmişte
 * tepeye sıfırlanıp tüm mesajların üzerinden kaymak "yukarı-aşağı zıplama" yapar.
 */
export default function useStickChatToBottom(messages) {
  const scrollRef = useRef(null)
  const stickToBottomRef = useRef(true)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTop = el.scrollHeight
  }, [messages])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX
  }

  return { scrollRef, onScroll }
}
