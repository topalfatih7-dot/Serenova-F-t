import { useCallback, useEffect, useState } from 'react'
import { mailboxRequest } from '../services/mailboxApi'

export default function useAdminMailboxUnread() {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const json = await mailboxRequest('unread-count')
      setUnreadCount(Number(json.unreadCount || 0))
    } catch {
      /* admin değilse veya API yok */
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = window.setInterval(refresh, 60_000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [refresh])

  return { unreadCount, refreshMailboxUnread: refresh }
}
