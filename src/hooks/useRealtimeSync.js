import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import { fetchActiveUsers } from '../services/presenceService'
import { rowToTicket, rowToMember, rowToProgram } from '../services/supabaseDb'
import { rowToChatThread, rowToChatMessage } from '../services/chatDb'
import { rowToAdminStaffThread, rowToAdminStaffMessage } from '../services/adminChatDb'
import { rowToStaffCollabThread, rowToStaffCollabMessage } from '../services/staffCollabChatDb'

export function useActiveUsers(isAdmin) {
  const [activeUsers, setActiveUsers] = useState([])

  const refresh = useCallback(async () => {
    if (!isAdmin) return
    const list = await fetchActiveUsers()
    setActiveUsers(list)
  }, [isAdmin])

  useEffect(() => {
    if (!isAdmin || !supabase) return undefined
    const kick = setTimeout(() => { void refresh() }, 0)
    const poll = setInterval(refresh, 15_000)
    const channel = supabase
      .channel('admin-presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, refresh)
      .subscribe()
    return () => {
      clearTimeout(kick)
      clearInterval(poll)
      supabase.removeChannel(channel)
    }
  }, [isAdmin, refresh])

  return { activeUsers, refreshActiveUsers: refresh }
}

export function subscribeRealtimeSync({
  session,
  memberId,
  staffId,
  isChatMessageRelevant,
  isAdminStaffMessageRelevant,
  isStaffCollabMessageRelevant,
  onTicketsChange,
  onMemberChange,
  onChatThreadChange,
  onChatMessageChange,
  onAdminStaffThreadChange,
  onAdminStaffMessageChange,
  onStaffCollabThreadChange,
  onStaffCollabMessageChange,
  onApplicationsChange,
  onProgramsChange,
}) {
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

  const chatThreadChannel = supabase
    .channel('chat-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return
      if (payload.new) {
        const thread = rowToChatThread(payload.new)
        if (session.type === 'member' && thread.memberId !== memberId) return
        if (session.type === 'staff' && String(thread.staffId) !== String(staffId)) return
        onChatThreadChange?.(thread)
      }
    })
    .subscribe()
  channels.push(chatThreadChannel)

  const chatMessageChannel = supabase
    .channel('chat-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
      if (!payload.new) return
      const threadId = payload.new.thread_id
      if (isChatMessageRelevant && !isChatMessageRelevant(threadId)) return
      onChatMessageChange?.(rowToChatMessage(payload.new))
    })
    .subscribe()
  channels.push(chatMessageChannel)

  const adminStaffThreadChannel = supabase
    .channel('admin-staff-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_staff_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return
      if (payload.new) {
        const thread = rowToAdminStaffThread(payload.new)
        if (session.type === 'staff' && String(thread.staffId) !== String(staffId)) return
        onAdminStaffThreadChange?.(thread)
      }
    })
    .subscribe()
  channels.push(adminStaffThreadChannel)

  const adminStaffMessageChannel = supabase
    .channel('admin-staff-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'admin_staff_messages' }, (payload) => {
      if (!payload.new) return
      const threadId = payload.new.thread_id
      if (isAdminStaffMessageRelevant && !isAdminStaffMessageRelevant(threadId)) return
      onAdminStaffMessageChange?.(rowToAdminStaffMessage(payload.new))
    })
    .subscribe()
  channels.push(adminStaffMessageChannel)

  const staffCollabThreadChannel = supabase
    .channel('staff-collab-threads-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'staff_collab_threads' }, (payload) => {
      if (!payload.new && payload.eventType === 'DELETE') return
      if (payload.new) {
        const thread = rowToStaffCollabThread(payload.new)
        if (session.type === 'staff') {
          const sid = String(staffId)
          if (String(thread.coachId) !== sid && String(thread.dietitianId) !== sid) return
        }
        onStaffCollabThreadChange?.(thread)
      }
    })
    .subscribe()
  channels.push(staffCollabThreadChannel)

  const staffCollabMessageChannel = supabase
    .channel('staff-collab-messages-sync')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'staff_collab_messages' }, (payload) => {
      if (!payload.new) return
      const threadId = payload.new.thread_id
      if (isStaffCollabMessageRelevant && !isStaffCollabMessageRelevant(threadId)) return
      onStaffCollabMessageChange?.(rowToStaffCollabMessage(payload.new))
    })
    .subscribe()
  channels.push(staffCollabMessageChannel)

  if (session.type === 'admin') {
    for (const table of ['staff_applications', 'corporate_applications', 'contact_inquiries']) {
      const appChannel = supabase
        .channel(`apps-sync-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          onApplicationsChange?.()
        })
        .subscribe()
      channels.push(appChannel)
    }
  }

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

    const programsChannel = supabase
      .channel(`programs-member-${memberId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `member_id=eq.${memberId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            onProgramsChange?.({ type: 'delete', id: payload.old?.id })
            return
          }
          if (payload.new) {
            onProgramsChange?.({ type: 'upsert', program: rowToProgram(payload.new) })
          }
        },
      )
      .subscribe()
    channels.push(programsChannel)
  }

  if (session.type === 'staff' && staffId) {
    const staffProgramsChannel = supabase
      .channel(`programs-staff-${staffId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'programs', filter: `staff_id=eq.${staffId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            onProgramsChange?.({ type: 'delete', id: payload.old?.id })
            return
          }
          if (payload.new) {
            onProgramsChange?.({ type: 'upsert', program: rowToProgram(payload.new) })
          }
        },
      )
      .subscribe()
    channels.push(staffProgramsChannel)
  }

  return () => channels.forEach((ch) => supabase.removeChannel(ch))
}
