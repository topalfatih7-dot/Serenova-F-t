import { supabase } from './supabaseClient'
import {
  packageIncludesCoach,
  packageIncludesDietitian,
  isPaidMembership,
} from '../data/membershipPlans'
import { normalizeStaffRole } from '../utils/staffRoles'
import { detectExternalContactInfo, CONTACT_INFO_BLOCK_MESSAGE } from '../utils/contactInfoGuard'
import { notifyStaffCollabMessage } from './staffNotifications'

const nowISO = () => new Date().toISOString()

export function rowToStaffCollabThread(row) {
  const d = row.data || {}
  return {
    id: row.id,
    memberId: row.member_id,
    coachId: row.coach_id,
    dietitianId: row.dietitian_id,
    lastMessageAt: row.last_message_at,
    memberName: d.memberName || '',
    coachName: d.coachName || '',
    dietitianName: d.dietitianName || '',
    lastPreview: d.lastPreview || '',
    coachUnread: Number(d.coachUnread || 0),
    dietitianUnread: Number(d.dietitianUnread || 0),
    createdAt: row.created_at,
    data: d,
  }
}

export function rowToStaffCollabMessage(row) {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderType: row.sender_type,
    senderId: row.sender_id,
    text: row.data?.text || '',
    createdAt: row.created_at,
  }
}

/** Collab thread için koç+diyet zorunlu. */
function memberEligibleForCollab(member) {
  if (!member?.assignedCoachId || !member?.assignedDietitianId) return false
  if (!isPaidMembership(member.membership)) return false
  const status = member.membershipStatus || 'active'
  if (status !== 'active' && status !== 'expiring') return false
  const pkg = member.packageConfig || {}
  return packageIncludesCoach(pkg) && packageIncludesDietitian(pkg)
}

export function getStaffCollabMembers(members = [], staffUser) {
  const role = normalizeStaffRole(staffUser?.role)
  if (role !== 'coach' && role !== 'dietitian') return []
  const sid = String(staffUser.id)
  const key = role === 'coach' ? 'assignedCoachId' : 'assignedDietitianId'
  return members.filter((m) => memberEligibleForCollab(m) && String(m[key]) === sid)
}

export function staffCollabMembersSignature(members = [], staffUser) {
  return getStaffCollabMembers(members, staffUser)
    .map((m) => m.id)
    .sort()
    .join(',')
}

export async function fetchStaffCollabThreadsForStaff(staffUser) {
  const role = normalizeStaffRole(staffUser?.role)
  if (role !== 'coach' && role !== 'dietitian') return []
  const column = role === 'coach' ? 'coach_id' : 'dietitian_id'
  const { data, error } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .eq(column, staffUser.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToStaffCollabThread)
}

export async function fetchAllStaffCollabThreads() {
  const { data, error } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .order('last_message_at', { ascending: false, nullsFirst: false })
  if (error) return []
  return (data || []).map(rowToStaffCollabThread)
}

export async function fetchStaffCollabMessages(threadId, limit = 200) {
  const { data, error } = await supabase
    .from('staff_collab_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(limit)
  if (error) return []
  return (data || []).map(rowToStaffCollabMessage)
}

export async function getOrCreateStaffCollabThread(member, staffList = []) {
  if (!memberEligibleForCollab(member)) return null

  const coachId = member.assignedCoachId
  const dietitianId = member.assignedDietitianId
  const coach = staffList.find((s) => String(s.id) === String(coachId))
  const dietitian = staffList.find((s) => String(s.id) === String(dietitianId))

  const { data: existing } = await supabase
    .from('staff_collab_threads')
    .select('*')
    .eq('member_id', member.id)
    .maybeSingle()

  if (existing) {
    return rowToStaffCollabThread(existing)
  }

  const { data: row, error } = await supabase.from('staff_collab_threads').insert({
    member_id: member.id,
    coach_id: coachId,
    dietitian_id: dietitianId,
    data: {
      memberName: member.name || 'Danışan',
      coachName: coach?.name || 'Koç',
      dietitianName: dietitian?.name || 'Diyetisyen',
      coachUnread: 0,
      dietitianUnread: 0,
      lastPreview: '',
    },
  }).select().single()

  if (error) return null
  return rowToStaffCollabThread(row)
}

export async function ensureStaffCollabThreads(staffUser, members = [], staffList = []) {
  const clients = getStaffCollabMembers(members, staffUser)
  const threads = []
  for (const member of clients) {
    const thread = await getOrCreateStaffCollabThread(member, staffList)
    if (thread) threads.push(thread)
  }
  return threads.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || a.createdAt || 0).getTime()
    const bTime = new Date(b.lastMessageAt || b.createdAt || 0).getTime()
    return bTime - aTime
  })
}

export async function sendStaffCollabMessage({ thread, senderType, senderId, text }) {
  const value = String(text || '').trim()
  if (!value || !thread?.id) return { success: false, error: 'Mesaj boş.' }
  if (senderType !== 'coach' && senderType !== 'dietitian') {
    return { success: false, error: 'Geçersiz gönderici.' }
  }

  const guard = detectExternalContactInfo(value)
  if (guard.blocked) return { success: false, error: CONTACT_INFO_BLOCK_MESSAGE, blockedReason: guard.reason }

  const { data: msgRow, error: msgErr } = await supabase.from('staff_collab_messages').insert({
    thread_id: thread.id,
    sender_type: senderType,
    sender_id: senderId || null,
    data: { text: value },
  }).select().single()

  if (msgErr) {
    const isContactBlock = msgErr.message?.includes('CONTACT_INFO_BLOCKED')
    return { success: false, error: isContactBlock ? CONTACT_INFO_BLOCK_MESSAGE : msgErr.message }
  }

  const preview = value.length > 120 ? `${value.slice(0, 119)}…` : value
  const data = { ...(thread.data || {}) }
  data.lastPreview = preview
  if (senderType === 'coach') {
    data.dietitianUnread = Number(data.dietitianUnread || 0) + 1
  } else {
    data.coachUnread = Number(data.coachUnread || 0) + 1
  }

  await supabase.from('staff_collab_threads').update({
    last_message_at: nowISO(),
    data,
  }).eq('id', thread.id)

  const { data: live } = await supabase
    .from('staff_collab_threads')
    .select('coach_id, dietitian_id, member_id, data')
    .eq('id', thread.id)
    .maybeSingle()
  const coachId = String(live?.coach_id || thread.coachId || thread.coach_id || '')
  const dietitianId = String(live?.dietitian_id || thread.dietitianId || thread.dietitian_id || '')
  const memberId = String(live?.member_id || thread.memberId || '')
  const memberName = String(live?.data?.memberName || thread.memberName || '')
  const selfId = senderId ? String(senderId) : ''

  const peerIds = new Set()
  if (senderType !== 'coach' && coachId) peerIds.add(coachId)
  if (senderType !== 'dietitian' && dietitianId) peerIds.add(dietitianId)
  await Promise.all(
    [...peerIds]
      .filter((peerId) => peerId && peerId !== selfId)
      .map((peerId) => notifyStaffCollabMessage({
        staffId: peerId,
        preview,
        threadId: thread.id,
        memberId,
        memberName,
        senderRole: senderType,
        senderId: selfId || null,
      })),
  )

  return {
    success: true,
    message: rowToStaffCollabMessage(msgRow),
    thread: rowToStaffCollabThread({
      ...thread,
      member_id: thread.memberId,
      coach_id: thread.coachId,
      dietitian_id: thread.dietitianId,
      last_message_at: nowISO(),
      data,
    }),
  }
}

export async function markStaffCollabThreadRead(threadId, readerType) {
  const { data: row } = await supabase.from('staff_collab_threads').select('*').eq('id', threadId).maybeSingle()
  if (!row) return null
  const data = { ...(row.data || {}) }
  if (readerType === 'coach') data.coachUnread = 0
  if (readerType === 'dietitian') data.dietitianUnread = 0
  await supabase.from('staff_collab_threads').update({ data }).eq('id', threadId)
  return rowToStaffCollabThread({ ...row, data })
}

export async function hydrateStaffCollabThreads(session, members, staffList, staffUser) {
  if (!session) return []
  if (session.type === 'admin') {
    return fetchAllStaffCollabThreads()
  }
  if (session.type === 'staff' && staffUser?.id) {
    return ensureStaffCollabThreads(staffUser, members, staffList)
  }
  return []
}
