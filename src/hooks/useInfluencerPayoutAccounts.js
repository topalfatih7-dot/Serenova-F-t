import { useCallback, useEffect, useState } from 'react'
import { fetchAllInfluencerPayoutAccounts, fetchOwnInfluencerPayoutAccount } from '../services/influencerDb'

export default function useInfluencerPayoutAccounts({ influencerId = null, all = false } = {}) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      if (all) {
        setAccounts(await fetchAllInfluencerPayoutAccounts())
      } else if (influencerId) {
        const row = await fetchOwnInfluencerPayoutAccount(influencerId)
        setAccounts(row ? [row] : [])
      } else {
        setAccounts([])
      }
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [influencerId, all])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = all
          ? await fetchAllInfluencerPayoutAccounts()
          : influencerId
            ? await fetchOwnInfluencerPayoutAccount(influencerId)
            : null
        if (cancelled) return
        if (all) setAccounts(next)
        else setAccounts(next ? [next] : [])
      } catch {
        if (!cancelled) setAccounts([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [influencerId, all])

  return { accounts, account: accounts[0] || null, loading, reload: () => load({ silent: true }) }
}
