import { useEffect, useState } from 'react'
import { fetchDailyTip } from '../services/dailyTip.js'
import { pickFallbackTip } from '../data/dailyTipFallback.js'

export function useDailyTip() {
  const today = new Date().toLocaleDateString('en-CA')
  const [tip, setTip] = useState(() => pickFallbackTip(today))
  const [loading, setLoading] = useState(true)
  const [aiGenerated, setAiGenerated] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await fetchDailyTip()
      if (cancelled) return
      if (result.tip) {
        setTip(result.tip)
        setAiGenerated(Boolean(result.aiGenerated))
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  return { tip, loading, aiGenerated }
}
