import { useCallback, useEffect, useState } from 'react'
import { fetchAllPayoutAccounts, fetchOwnPayoutAccount } from '../services/staffPayoutAccounts'

export default function useStaffPayoutAccounts({ staffId = null, all = false } = {}) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      if (all) {
        setAccounts(await fetchAllPayoutAccounts())
      } else if (staffId) {
        const row = await fetchOwnPayoutAccount(staffId)
        setAccounts(row ? [row] : [])
      } else {
        setAccounts([])
      }
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }, [staffId, all])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const next = all
          ? await fetchAllPayoutAccounts()
          : staffId
            ? await fetchOwnPayoutAccount(staffId)
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
  }, [staffId, all])

  return { accounts, account: accounts[0] || null, loading, reload: () => load({ silent: true }) }
}
