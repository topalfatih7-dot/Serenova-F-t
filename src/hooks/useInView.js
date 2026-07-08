import { useEffect, useState } from 'react'

/** Görünür olduğunda true — lazy thumbnail / prefetch için. */
export function useInView(ref, { rootMargin = '160px', once = true, enabled = true } = {}) {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!enabled) {
      setInView(false)
      return undefined
    }

    const el = ref.current
    if (!el) return undefined

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { rootMargin, threshold: 0.01 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, rootMargin, once, enabled])

  return inView
}
