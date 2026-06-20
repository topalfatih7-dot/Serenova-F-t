import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { fetchActiveUsers } from '../services/presenceService'
import { rowToTicket, rowToMember } from '../services/supabaseDb'

export function useActiveUsers(isAdmin) {
  const [activeUsers, setActiveUsers] = useState([])

  const refresh = useCallback(async () => {
    if (!isAdmin) return
    const list = await fetchActiveUsers()
    setActiveUsers(list)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || !supabase) return undefined
    refresh()
    const poll = setInterval(refresh, 15_000)
    const channel = supabase
      .channel('admin-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, refresh)
      .subscribe()
    return () => {
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [isAdmin, refresh])

  return { activeUsers, refreshActiveUsers: refresh }
}

export function subscribeRealtimeSync({ session, memberId, onTicketsChange, onMemberChange }) {
  if (!supabase || !session) return () => {}

  const channels = []

  const ticketChannel = supabase
    .channel('tickets-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
      if (payload.eventType === 'DELETE') {
        onTicketsChange?.({ type: 'delete', id: payload.old?.id })
        return
      }
      if (payload.new) {
        onTicketsChange?.({ type: 'upsert', ticket: rowToTicket(payload.new) })
      }
    })
    .subscribe()
  channels.push(ticketChannel)

  if (session.type === 'member' && memberId) {
    const memberChannel = supabase
      .channel(`member-${memberId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'members', filter: `id=eq.${memberId}` },
        (payload) => {
          if (payload.new) onMemberChange?.(rowToMember(payload.new))
        },
      )
      .subscribe()
    channels.push(memberChannel)
  }

  return () => channels.forEach((ch) => supabase.removeChannel(ch))
}
