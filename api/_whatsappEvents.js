/**
 * High-level WhatsApp notification events (member + staff).
 * Called from book-session, application-notify, session-reminders, etc.
 */

import {
  sendWhatsAppTemplate,
  formatWhenTr,
  sessionTypeLabel,
  memberPhoneFromData,
  staffPhoneFromData,
  memberWhatsAppSettings,
  staffWhatsAppSettings,
  siteUrl,
} from './_whatsapp.js'

const CHAT_WA_THROTTLE_MS = 30 * 60 * 1000
const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

function sessionKey(type) {
  return SESSION_KEYS[String(type || '').toLowerCase()] || 'dietitianSessions'
}

function buildNotif(type, title, message, extra = {}) {
  return {
    id: `n-${type}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    ...extra,
  }
}

async function appendMemberNotification(admin, memberId, notification) {
  if (!admin || !memberId || !notification?.title) return
  const { data: row } = await admin.from('members').select('data').eq('id', memberId).maybeSingle()
  if (!row) return
  const data = { ...(row.data || {}) }
  const prev = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications = [notification, ...prev].slice(0, 100)
  await admin.from('members').update({ data, updated_at: new Date().toISOString() }).eq('id', memberId)
}

async function appendStaffNotification(admin, staffId, notification) {
  if (!admin || !staffId || !notification?.title) return
  const { data: row } = await admin.from('staff').select('data').eq('id', staffId).maybeSingle()
  if (!row) return
  const data = { ...(row.data || {}) }
  const prev = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications = [notification, ...prev].slice(0, 100)
  await admin.from('staff').update({ data }).eq('id', staffId)
}

async function loadMember(admin, memberId) {
  const { data } = await admin
    .from('members')
    .select('id, name, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
    .eq('id', memberId)
    .maybeSingle()
  return data
}

async function loadStaff(admin, staffId) {
  const { data } = await admin
    .from('staff')
    .select('id, name, role, data')
    .eq('id', staffId)
    .maybeSingle()
  return data
}

function resolveAssignedStaffId(memberRow, sessionType) {
  if (sessionType === 'coach') return memberRow.assigned_coach_id
  if (sessionType === 'dietitian') return memberRow.assigned_dietitian_id
  if (sessionType === 'doctor') return memberRow.assigned_doctor_id
  return null
}

export async function notifyAppointmentConfirmed(admin, {
  memberId,
  staffId,
  sessionType,
  startsAt,
  sessionId,
  memberName,
  staffName,
} = {}) {
  const when = formatWhenTr(startsAt)
  const roleLabel = sessionTypeLabel(sessionType)
  const results = []

  const member = memberId ? await loadMember(admin, memberId) : null
  const staff = staffId ? await loadStaff(admin, staffId) : null

  if (member) {
    await appendMemberNotification(admin, member.id, buildNotif(
      'appointment',
      'Randevunuz kaydedildi',
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_confirmed_member',
      toPhone: memberPhoneFromData(member.data),
      params: {
        name: member.name || memberName || 'Üye',
        when,
        roleLabel,
      },
      recipientRole: 'member',
      recipientId: member.id,
      event: 'appt_confirmed',
      settings: memberWhatsAppSettings(member.data),
    }))
  }

  if (staff) {
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_confirmed_staff',
      toPhone: staffPhoneFromData(staff.data),
      params: {
        memberName: memberName || member?.name || 'Danışan',
        when,
        roleLabel,
      },
      recipientRole: 'staff',
      recipientId: staff.id,
      event: 'appt_confirmed',
      settings: staffWhatsAppSettings(staff.data),
    }))
  }

  return { ok: true, results }
}

export async function notifyAppointmentCancelled(admin, {
  memberId,
  staffId,
  sessionType,
  startsAt,
  sessionId,
  actor = 'member',
} = {}) {
  const when = formatWhenTr(startsAt)
  const roleLabel = sessionTypeLabel(sessionType)
  const member = memberId ? await loadMember(admin, memberId) : null
  const resolvedStaffId = staffId || (member ? resolveAssignedStaffId(member, sessionType) : null)
  const staff = resolvedStaffId ? await loadStaff(admin, resolvedStaffId) : null
  const results = []

  if (actor === 'member' && staff) {
    await appendStaffNotification(admin, staff.id, buildNotif(
      'appointment',
      'Randevu iptal edildi',
      `${member?.name || 'Danışan'} — ${when}`,
      { memberId, sessionId, sessionType, startsAt },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_cancelled',
      toPhone: staffPhoneFromData(staff.data),
      params: { subjectName: member?.name || 'Danışan', when },
      recipientRole: 'staff',
      recipientId: staff.id,
      event: 'appt_cancelled',
      settings: staffWhatsAppSettings(staff.data),
    }))
  }

  if (actor === 'staff' && member) {
    await appendMemberNotification(admin, member.id, buildNotif(
      'appointment',
      'Randevu iptal edildi',
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_cancelled',
      toPhone: memberPhoneFromData(member.data),
      params: { subjectName: roleLabel, when },
      recipientRole: 'member',
      recipientId: member.id,
      event: 'appt_cancelled',
      settings: memberWhatsAppSettings(member.data),
    }))
  }

  return { ok: true, results }
}

export async function notifyAppointmentRescheduled(admin, {
  memberId,
  staffId,
  sessionType,
  oldStartsAt,
  newStartsAt,
  sessionId,
  actor = 'member',
} = {}) {
  const oldWhen = formatWhenTr(oldStartsAt)
  const newWhen = formatWhenTr(newStartsAt)
  const roleLabel = sessionTypeLabel(sessionType)
  const member = memberId ? await loadMember(admin, memberId) : null
  const resolvedStaffId = staffId || (member ? resolveAssignedStaffId(member, sessionType) : null)
  const staff = resolvedStaffId ? await loadStaff(admin, resolvedStaffId) : null
  const results = []

  if (actor === 'member' && staff) {
    await appendStaffNotification(admin, staff.id, buildNotif(
      'appointment',
      'Randevu ertelendi',
      `${member?.name || 'Danışan'} — ${oldWhen} → ${newWhen}`,
      { memberId, sessionId, sessionType, startsAt: newStartsAt },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_rescheduled',
      toPhone: staffPhoneFromData(staff.data),
      params: {
        subjectName: member?.name || 'Danışan',
        oldWhen,
        newWhen,
      },
      recipientRole: 'staff',
      recipientId: staff.id,
      event: 'appt_rescheduled',
      settings: staffWhatsAppSettings(staff.data),
    }))
  }

  if (actor === 'staff' && member) {
    await appendMemberNotification(admin, member.id, buildNotif(
      'appointment',
      'Randevu ertelendi',
      `${roleLabel}: ${oldWhen} → ${newWhen}`,
      { sessionId, sessionType, startsAt: newStartsAt },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey: 'appt_rescheduled',
      toPhone: memberPhoneFromData(member.data),
      params: {
        subjectName: roleLabel,
        oldWhen,
        newWhen,
      },
      recipientRole: 'member',
      recipientId: member.id,
      event: 'appt_rescheduled',
      settings: memberWhatsAppSettings(member.data),
    }))
  }

  return { ok: true, results }
}

export async function notifyProgramReady(admin, {
  memberId,
  staffName,
  title,
  programType,
} = {}) {
  const member = memberId ? await loadMember(admin, memberId) : null
  if (!member) return { ok: false, error: 'member_not_found' }
  const typeLabel = programType === 'nutrition' ? 'Beslenme' : 'Antrenman'
  return sendWhatsAppTemplate(admin, {
    templateKey: 'program_ready',
    toPhone: memberPhoneFromData(member.data),
    params: {
      memberName: member.name || 'Üye',
      staffName: staffName || 'Uzmanınız',
      programTitle: title || typeLabel,
    },
    recipientRole: 'member',
    recipientId: member.id,
    event: 'program_ready',
    settings: memberWhatsAppSettings(member.data),
  })
}

export async function notifyNewChatMessage(admin, {
  threadId,
  senderType,
  memberId,
  staffId,
  staffRole,
} = {}) {
  if (!threadId) return { ok: false, error: 'thread_required' }

  const { data: thread } = await admin
    .from('chat_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle()
  if (!thread) return { ok: false, error: 'thread_not_found' }

  const data = { ...(thread.data || {}) }
  const lastAt = data.waLastNotifyAt ? new Date(data.waLastNotifyAt).getTime() : 0
  if (lastAt && Date.now() - lastAt < CHAT_WA_THROTTLE_MS) {
    return { ok: true, skipped: true, reason: 'throttled' }
  }

  const mid = memberId || thread.member_id
  const sid = staffId || thread.staff_id
  const role = staffRole || thread.staff_role
  const roleLabel = sessionTypeLabel(role)
  const panel = `${siteUrl()}/messages`

  let result
  if (senderType === 'staff') {
    const member = await loadMember(admin, mid)
    if (!member) return { ok: false, error: 'member_not_found' }
    result = await sendWhatsAppTemplate(admin, {
      templateKey: 'new_chat_message',
      toPhone: memberPhoneFromData(member.data),
      params: {
        recipientName: member.name || 'Üye',
        senderLabel: `${roleLabel}unuz`,
      },
      recipientRole: 'member',
      recipientId: member.id,
      event: 'new_chat_message',
      settings: memberWhatsAppSettings(member.data),
    })
  } else {
    const staff = await loadStaff(admin, sid)
    const member = await loadMember(admin, mid)
    if (!staff) return { ok: false, error: 'staff_not_found' }

    // In-app staff chat notify is owned by sendChatMessage (notifyStaffChatMessage).
    // Appending here doubled toasts/sounds: "Ahmet yeni mesaj gönderdi" + "Yeni danışan mesajı".
    result = await sendWhatsAppTemplate(admin, {
      templateKey: 'new_chat_message',
      toPhone: staffPhoneFromData(staff.data),
      params: {
        recipientName: staff.name || 'Uzman',
        senderLabel: member?.name || data.memberName || 'Danışan',
      },
      recipientRole: 'staff',
      recipientId: staff.id,
      event: 'new_chat_message',
      settings: staffWhatsAppSettings(staff.data),
    })
  }

  if (result?.ok && !result.skipped) {
    data.waLastNotifyAt = new Date().toISOString()
    data.waPanelHint = panel
    await admin.from('chat_threads').update({ data }).eq('id', threadId)
  }

  return result
}

export async function notifySessionReminder(admin, {
  memberId,
  staffId,
  sessionType,
  startsAt,
  sessionId,
  windowKey,
} = {}) {
  const templateKey = windowKey === 't1' ? 'appt_reminder_1h' : 'appt_reminder_24h'
  const when = formatWhenTr(startsAt)
  const roleLabel = sessionTypeLabel(sessionType)
  const member = memberId ? await loadMember(admin, memberId) : null
  const staff = staffId ? await loadStaff(admin, staffId) : (member
    ? await loadStaff(admin, resolveAssignedStaffId(member, sessionType))
    : null)
  const results = []

  if (member) {
    const title = windowKey === 't1' ? 'Randevunuz 1 saat sonra' : 'Randevunuz yarın'
    await appendMemberNotification(admin, member.id, buildNotif(
      'appointment',
      title,
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt, reminder: windowKey },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey,
      toPhone: memberPhoneFromData(member.data),
      params: {
        name: member.name || 'Üye',
        roleLabel,
        when,
      },
      recipientRole: 'member',
      recipientId: member.id,
      event: `appt_reminder_${windowKey}`,
      settings: memberWhatsAppSettings(member.data),
    }))
  }

  if (staff) {
    await appendStaffNotification(admin, staff.id, buildNotif(
      'appointment',
      windowKey === 't1' ? 'Görüşme 1 saat sonra' : 'Görüşme yarın',
      `${member?.name || 'Danışan'} — ${when}`,
      { memberId, sessionId, sessionType, startsAt, reminder: windowKey },
    ))
    results.push(await sendWhatsAppTemplate(admin, {
      templateKey,
      toPhone: staffPhoneFromData(staff.data),
      params: {
        name: staff.name || 'Uzman',
        roleLabel: member?.name || 'Danışan',
        when,
      },
      recipientRole: 'staff',
      recipientId: staff.id,
      event: `appt_reminder_${windowKey}`,
      settings: staffWhatsAppSettings(staff.data),
    }))
  }

  return { ok: true, results }
}

export { sessionKey, SESSION_KEYS }
