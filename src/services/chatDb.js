import { supabase } from './supabaseClient'
import { getMemberChatContacts, getStaffClients } from '../utils/chatAccess'

const nowISO = () => new Date().toISOString()

function rowToChatThread(row) {
  const d = row.data || {}
  return {
    id: row.id,
    memberId: row.member_id,
    staffId: row.staff_id,
    staffRole: row.staff_role,
    lastMessageAt: row.last_message_at,
    memberName: d.memberName || '',
    staffName: d.staffName || '',
    lastPreview: d.lastPreview || '',
    memberUnread: Number(d.memberUnread || 0),
    staffUnread: Number(d.staffUnread || 0),
    memberConsentAt: d.memberConsentAt || null,
    createdAt: row.created_at,
    data: d,
  }
}

function rowToChatMessage(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  }
}

export { rowToChatThread, rowToChatMessage }

async function pushMemberChatNotification(memberId, { title, message, threadId, role }) {
  if (!memberId) return
  const { data: memberRow } = await supabase.from('members').select('*').eq('id', memberId).maybeSingle()
  if (!memberRow) return
  const data = memberRow.data || {}
  const notifications = [
    {
      id: `n-chat-${Date.now()}`,
      type: 'chat',
      title,
      message,
      read: false,
      createdAt: nowISO(),
      threadId,
      staffRole: role,
    },
    ...(data.notifications || []),
  ]
  await supabase.from('members').update({
    data: { ...data, notifications },
    updated_at: nowISO(),
  }).eq('id', memberId)
}

export async function fetchChatThreadsForMember(memberId) {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('member_id', memberId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToChatThread)
}

export async function fetchChatThreadsForStaff(staffId) {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('staff_id', staffId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToChatThread)
}

export async function fetchAllChatThreadsForAdmin() {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToChatThread)
}

export async function fetchChatMessages(threadId, limit = 200) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) return []
  return (data || []).map(rowToChatMessage)
}

export async function getOrCreateChatThread(member, staffContact) {
  const { data: existing } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('member_id', member.id)
    .eq('staff_role', staffContact.role)
    .maybeSingle()

  if (existing) return rowToChatThread(existing)

  const { data: row, error } = await supabase.from('chat_threads').insert({
    member_id: member.id,
    staff_id: staffContact.staffId,
    staff_role: staffContact.role,
    data: {
      memberName: member.name || 'Üye',
      staffName: staffContact.name || '',
      memberUnread: 0,
      staffUnread: 0,
    },
  }).select().single()

  if (error) return null
  return rowToChatThread(row)
}

export async function ensureMemberChatThreads(member, staffList) {
  const contacts = getMemberChatContacts(member, staffList)
  const threads = []
  for (const contact of contacts) {
    const thread = await getOrCreateChatThread(member, contact)
    if (thread) threads.push(thread)
  }
  return threads
}

export async function recordChatConsent(threadId) {
  const { data: row } = await supabase.from('chat_threads').select('*').eq('id', threadId).maybeSingle()
  if (!row) return null
  const data = { ...(row.data || {}), memberConsentAt: nowISO() }
  await supabase.from('chat_threads').update({ data }).eq('id', threadId)
  return rowToChatThread({ ...row, data })
}

export async function sendChatMessage({ thread, senderType, senderId, text }) {
  const value = String(text || '').trim()
  if (!value || !thread?.id) return { success: false, error: 'Mesaj boş.' }

  const { data: msgRow, error: msgErr } = await supabase.from('chat_messages').insert({
    thread_id: thread.id,
    sender_type: senderType,
    sender_id: senderId || null,
    data: { text: value },
  }).select().single()

  if (msgErr) return { success: false, error: msgErr.message }

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value
  const data = { ...(thread.data || {}) }
  data.lastPreview = preview
  if (senderType === 'member') {
    data.staffUnread = Number(data.staffUnread || 0) + 1
  } else if (senderType === 'staff') {
    data.memberUnread = Number(data.memberUnread || 0) + 1
  }

  await supabase.from('chat_threads').update({
    last_message_at: nowISO(),
    data,
  }).eq('id', thread.id)

  if (senderType === 'staff') {
    const roleLabel = thread.staffRole === 'dietitian' ? 'Diyetisyeniniz' : 'Koçunuz'
    await pushMemberChatNotification(thread.memberId, {
      title: `${roleLabel}den yeni mesaj`,
      message: preview,
      threadId: thread.id,
      role: thread.staffRole,
    })
  }

  return {
    success: true,
    message: rowToChatMessage(msgRow),
    thread: rowToChatThread({
      ...thread,
      member_id: thread.memberId,
      staff_id: thread.staffId,
      staff_role: thread.staffRole,
      last_message_at: nowISO(),
      data,
    }),
  }
}

export async function markChatThreadRead(threadId, readerType) {
  const { data: row } = await supabase.from('chat_threads').select('*').eq('id', threadId).maybeSingle()
  if (!row) return null
  const data = { ...(row.data || {}) }
  if (readerType === 'member') data.memberUnread = 0
  if (readerType === 'staff') data.staffUnread = 0
  await supabase.from('chat_threads').update({ data }).eq('id', threadId)
  return rowToChatThread({ ...row, data })
}

export async function ensureStaffChatThreads(staff, clients = []) {
  if (!staff?.id) return []
  for (const member of clients) {
    await getOrCreateChatThread(member, {
      role: staff.role,
      staffId: staff.id,
      name: staff.name,
    })
  }
  return fetchChatThreadsForStaff(staff.id)
}

export async function hydrateChatThreads(session, member, staffList, staffUser, members) {
  if (!session) return []
  if (session.type === 'admin') {
    return fetchAllChatThreadsForAdmin()
  }
  if (session.type === 'member' && member) {
    return ensureMemberChatThreads(member, staffList)
  }
  if (session.type === 'staff' && session.staffId && staffUser) {
    const clients = getStaffClients(members || [], staffUser.role, staffUser.id)
    return ensureStaffChatThreads(staffUser, clients)
  }
  return []
}
