import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../services/supabaseClient'
import { fetchPresenceForUsers } from '../services/presenceService'
import { isUserOnline } from '../utils/presenceStatus'

/**
 * Chat partner user_id → { lastSeenAt, online, role }
 */
export function useChatPresence(userIds = [], { includeAdmins = false } = {}) {
  const [presenceMap, setPresenceMap] = useState({})

  const idsKey = useMemo(
    () => [...new Set(userIds.filter(Boolean).map(String))].sort().join(','),
    [userIds],
  )

  useEffect(() => {
    const ids = idsKey ? idsKey.split(',') : []
    if (!supabase || (!ids.length && !includeAdmins)) {
      setPresenceMap({})
      return undefined
    }

    let active = true

    const applyRows = (rows) => {
      if (!active) return
      setPresenceMap((prev) => {
        const next = { ...prev }
        rows.forEach((row) => {
          if (!row?.user_id) return
          next[row.user_id] = {
            lastSeenAt: row.last_seen_at,
            online: isUserOnline(row.last_seen_at),
            role: row.role,
          }
        })
        return next
      })
    }

    const load = async () => {
      const rows = await fetchPresenceForUsers(ids, { includeAdmins })
      applyRows(rows)
    }

    load()

    const channel = supabase
      .channel(`chat-presence-${idsKey || 'admins'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload) => {
        const row = payload.new || payload.old
        if (!row?.user_id) return
        const id = String(row.user_id)
        if (ids.includes(id) || (includeAdmins && row.role === 'admin')) {
          if (payload.eventType === 'DELETE') {
            setPresenceMap((prev) => {
              const next = { ...prev }
              delete next[id]
              return next
            })
            return
          }
          applyRows([row])
        }
      })
      .subscribe()

    const poll = setInterval(load, 30_000)

    return () => {
      active = false
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [idsKey, includeAdmins])

  const isOnline = (userId) => {
    if (!userId) return false
    return presenceMap[userId]?.online ?? false
  }

  const lastSeenAt = (userId) => presenceMap[userId]?.lastSeenAt ?? null

  const anyAdminOnline = useMemo(
    () => Object.values(presenceMap).some((p) => p.role === 'admin' && p.online),
    [presenceMap],
  )

  return { presenceMap, isOnline, lastSeenAt, anyAdminOnline }
}
