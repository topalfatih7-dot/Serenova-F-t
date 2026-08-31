import { useCallback, useEffect, useState } from 'react'
import { fetchInfluencerEarnings } from '../services/influencerDb'

export default function useInfluencerEarnings({ influencerId = null, all = false } = {}) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchRows = useCallback(async () => {
    return fetchInfluencerEarnings({ influencerId, all })
  }, [influencerId, all])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows(await fetchRows())
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [fetchRows])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await fetchRows()
        if (!cancelled) setRows(data)
      } catch {
        if (!cancelled) setRows([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [fetchRows])

  return { rows, loading, reload: load }
}
