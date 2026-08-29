import { supabase } from './supabaseClient'
import { notifyStaffAdminMessage } from './staffNotifications'

const nowISO = () => new Date().toISOString()

export function rowToAdminStaffThread(row) {
  const d = row.data || {}
  return {
    id: row.id,
    staffId: row.staff_id,
    lastMessageAt: row.last_message_at,
    staffName: d.staffName || '',
    staffRole: d.staffRole || '',
    lastPreview: d.lastPreview || '',
    adminUnread: Number(d.adminUnread || 0),
    staffUnread: Number(d.staffUnread || 0),
    createdAt: row.created_at,
    data: d,
  }
}

export function rowToAdminStaffMessage(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  }
}

export async function fetchAdminStaffThreads() {
  const { data, error } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToAdminStaffThread)
}

export async function fetchAdminStaffThreadsForStaff(staffId) {
  const { data, error } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .eq('staff_id', staffId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToAdminStaffThread)
}

export async function fetchAdminStaffMessages(threadId, limit = 200) {
  const { data, error } = await supabase
    .from('admin_staff_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) return []
  return (data || []).map(rowToAdminStaffMessage)
}

export async function getOrCreateAdminStaffThread(staff) {
  if (!staff?.id) return null

  const { data: existing } = await supabase
    .from('admin_staff_threads')
    .select('*')
    .eq('staff_id', staff.id)
    .maybeSingle()

  if (existing) return rowToAdminStaffThread(existing)

  const { data: row, error } = await supabase.from('admin_staff_threads').insert({
    staff_id: staff.id,
    data: {
      staffName: staff.name || 'Personel',
      staffRole: staff.role || '',
      adminUnread: 0,
      staffUnread: 0,
    },
  }).select().single()

  if (error) return null
  return rowToAdminStaffThread(row)
}

export async function ensureAdminStaffThreads(staffList = []) {
  const threads = []
  for (const staff of staffList) {
    const thread = await getOrCreateAdminStaffThread(staff)
    if (thread) threads.push(thread)
  }
  return threads.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export async function sendAdminStaffMessage({ thread, senderType, senderId, text }) {
  const value = String(text || '').trim()
  if (!value || !thread?.id) return { success: false, error: 'Mesaj boş.' }

  const { data: msgRow, error: msgErr } = await supabase.from('admin_staff_messages').insert({
    thread_id: thread.id,
    sender_type: senderType,
    sender_id: senderId || null,
    data: { text: value },
  }).select().single()

  if (msgErr) return { success: false, error: msgErr.message }

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value
  const data = { ...(thread.data || {}) }
  data.lastPreview = preview
  if (senderType === 'admin') {
    data.staffUnread = Number(data.staffUnread || 0) + 1
  } else if (senderType === 'staff') {
    data.adminUnread = Number(data.adminUnread || 0) + 1
  }

  await supabase.from('admin_staff_threads').update({
    last_message_at: nowISO(),
    data,
  }).eq('id', thread.id)

  if (senderType === 'admin' && thread.staffId) {
    void notifyStaffAdminMessage({
      staffId: thread.staffId,
      preview,
      threadId: thread.id,
    })
  }

  return {
    success: true,
    message: rowToAdminStaffMessage(msgRow),
    thread: rowToAdminStaffThread({
      ...thread,
      staff_id: thread.staffId,
      last_message_at: nowISO(),
      data,
    }),
  }
}

export async function markAdminStaffThreadRead(threadId, readerType) {
  const { data: row } = await supabase.from('admin_staff_threads').select('*').eq('id', threadId).maybeSingle()
  if (!row) return null
  const data = { ...(row.data || {}) }
  if (readerType === 'admin') data.adminUnread = 0
  if (readerType === 'staff') data.staffUnread = 0
  await supabase.from('admin_staff_threads').update({ data }).eq('id', threadId)
  return rowToAdminStaffThread({ ...row, data })
}

export async function hydrateAdminStaffThreads(session, staffList, staffUser) {
  if (!session) return []
  if (session.type === 'admin') {
    return ensureAdminStaffThreads(staffList)
  }
  if (session.type === 'staff' && staffUser?.id) {
    const thread = await getOrCreateAdminStaffThread(staffUser)
    return thread ? [thread] : []
  }
  return []
}
