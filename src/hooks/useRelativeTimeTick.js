import { useEffect, useState } from 'react'
import { RELATIVE_TIME_TICK_MS } from '../utils/relativeTime'

/** Göreli zaman etiketlerinin canlı güncellenmesi için */
export default function useRelativeTimeTick(intervalMs = RELATIVE_TIME_TICK_MS) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
}
