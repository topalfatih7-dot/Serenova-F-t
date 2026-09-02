/**
 * Randevu iptal zinciri:
 * - request-cancel-session (üye / personel / admin)
 * - respond-cancel-session (personel → cancel_pending)
 * - respond-admin-cancel (admin → admin_cancel_pending)
 */
import { sendExpoPushToMember, sendExpoPushToStaff } from './_expoPush.js'

const TZ = 'Europe/Istanbul'
const CANCEL_NOTICE_MS = 24 * 60 * 60 * 1000
const SESSION_KEYS = { coach: 'coachSessions', dietitian: 'dietitianSessions' }

function sessionKey(type) {
  return SESSION_KEYS[type] || 'dietitianSessions'
}

function assignColumn(type) {
  if (type === 'coach') return 'assigned_coach_id'
  return 'assigned_dietitian_id'
}

function formatWhen(dateISO) {
  if (!dateISO) return ''
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateISO))
}

function msUntil(session) {
  const t = new Date(session?.date || '').getTime()
  if (Number.isNaN(t)) return null
  return t - Date.now()
}

function hasMemberNotice(session) {
  const ms = msUntil(session)
  return ms != null && ms >= CANCEL_NOTICE_MS
}

function withinStaffAdminWindow(session) {
  const ms = msUntil(session)
  return ms != null && ms > 0 && ms < CANCEL_NOTICE_MS
}

async function isAdminUser(admin, user) {
  if (!user?.id) return false
  const { data } = await admin.from('members').select('role').eq('id', user.id).maybeSingle()
  return data?.role === 'admin'
}

async function resolveStaffRow(admin, authUser) {
  const email = (authUser.email || '').trim().toLowerCase()
  if (!email) return null
  const { data } = await admin.from('staff').select('id, name, role, data').ilike('email', email).maybeSingle()
  return data || null
}

function pushMemberNotification(data, notification) {
  const prev = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications = [notification, ...prev].slice(0, 100)
}

async function expoPushMember(admin, memberId, notification, senderId) {
  if (!memberId || !notification?.title) return
  try {
    await sendExpoPushToMember(admin, memberId, notification, { senderId: senderId || null })
  } catch {
    /* in-app kaydı asıl */
  }
}

async function pushStaffNotification(admin, staffId, notification, senderId) {
  if (!staffId) return
  const { data: staffRow } = await admin.from('staff').select('data').eq('id', staffId).maybeSingle()
  if (!staffRow) return
  const staffData = { ...(staffRow.data || {}) }
  const prev = Array.isArray(staffData.notifications) ? staffData.notifications : []
  staffData.notifications = [notification, ...prev].slice(0, 100)
  await admin.from('staff').update({ data: staffData }).eq('id', staffId)
  try {
    await sendExpoPushToStaff(admin, staffId, {
      ...notification,
      audience: 'staff',
    }, { senderId: senderId || null })
  } catch {
    /* in-app kaydı asıl */
  }
}

function finalizeCancelled(session, reason, actorId) {
  return {
    ...session,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    cancelledReason: reason,
    cancelRespondedAt: new Date().toISOString(),
    cancelRespondedBy: actorId || null,
  }
}

function restoreFromCancelRequest(session) {
  const prev = session.statusBeforeCancel || 'scheduled'
  const next = { ...session, status: prev }
  delete next.cancelRequestedAt
  delete next.cancelRequestedBy
  delete next.statusBeforeCancel
  next.cancelRespondedAt = new Date().toISOString()
  return next
}

async function loadMemberSession(admin, memberId, sessionType, sessionId) {
  const type = String(sessionType || '').toLowerCase()
  if (!['coach', 'dietitian'].includes(type)) {
    return { ok: false, error: 'Geçersiz randevu türü.' }
  }
  if (!memberId || !sessionId) return { ok: false, error: 'Eksik parametre.' }

  const { data: memberRow, error } = await admin
    .from('members')
    .select('id, name, data, assigned_coach_id, assigned_dietitian_id, role')
    .eq('id', memberId)
    .maybeSingle()
  if (error || !memberRow) return { ok: false, error: 'Üye bulunamadı.' }

  const key = sessionKey(type)
  const data = { ...(memberRow.data || {}) }
  const sessions = Array.isArray(data[key]) ? [...data[key]] : []
  const idx = sessions.findIndex((s) => String(s?.id) === String(sessionId))
  if (idx < 0) return { ok: false, error: 'Randevu bulunamadı.' }

  return { ok: true, type, key, memberRow, data, sessions, idx, session: sessions[idx] }
}

async function saveSessions(admin, memberId, data, key, sessions) {
  data[key] = sessions
  const { error } = await admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', memberId)
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

/**
 * Üye / personel / admin iptal isteği.
 * - Üye UI: memberId yok → üye kuralları
 * - Personel: memberId = danışan id
 * - Admin: memberId + forceAdmin: true → anında iptal
 */
export async function requestCancelSession(admin, authUser, {
  memberId,
  sessionId,
  sessionType,
  forceAdmin = false,
}) {
  const actorId = String(authUser.id)
  const explicitMemberId = memberId ? String(memberId) : ''
  const selfCancel = !explicitMemberId || explicitMemberId === actorId
  const targetMemberId = selfCancel ? actorId : explicitMemberId

  const loaded = await loadMemberSession(admin, targetMemberId, sessionType, sessionId)
  if (!loaded.ok) return loaded
  const { type, key, memberRow, data, sessions, idx, session } = loaded
  const status = session.status || 'scheduled'
  const assignedId = memberRow[assignColumn(type)]
  const when = formatWhen(session.date)
  const adminUser = await isAdminUser(admin, authUser)

  // Admin force (panel)
  if (forceAdmin && adminUser) {
    if (['cancelled', 'completed', 'rejected'].includes(status)) {
      return { ok: false, error: 'Bu randevu iptal edilemez.' }
    }
    sessions[idx] = finalizeCancelled(session, 'admin_cancel', authUser.id)
    const adminCancelNotif = {
      id: `n-cancel-admin-${Date.now().toString(36)}`,
      type: 'appointment',
      title: 'Randevunuz iptal edildi',
      message: `${when} tarihli görüşmeniz yönetim tarafından iptal edildi.`,
      read: false,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      sessionType: type,
      startsAt: session.date,
    }
    pushMemberNotification(data, adminCancelNotif)
    const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
    if (!saved.ok) return saved
    await expoPushMember(admin, memberRow.id, adminCancelNotif, authUser.id)
    return { ok: true, session: sessions[idx], outcome: 'cancelled', actor: 'admin' }
  }

  // Personel (danışan için)
  if (!selfCancel) {
    const staffRow = await resolveStaffRow(admin, authUser)
    if (staffRow && String(assignedId || '') === String(staffRow.id)) {
      if (!['scheduled', 'rescheduled', 'cancel_pending'].includes(status)) {
        return { ok: false, error: 'Bu randevu personel tarafından iptal edilemez.' }
      }
      if (withinStaffAdminWindow(session)) {
        sessions[idx] = {
          ...session,
          status: 'admin_cancel_pending',
          cancelRequestedAt: new Date().toISOString(),
          cancelRequestedBy: 'staff',
          statusBeforeCancel: status === 'cancel_pending'
            ? (session.statusBeforeCancel || 'scheduled')
            : status,
        }
        const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
        if (!saved.ok) return saved
        return { ok: true, session: sessions[idx], outcome: 'admin_cancel_pending', actor: 'staff' }
      }
      sessions[idx] = finalizeCancelled(session, 'staff_cancel', staffRow.id)
      const staffCancelNotif = {
        id: `n-cancel-staff-${Date.now().toString(36)}`,
        type: 'appointment',
        title: 'Randevunuz iptal edildi',
        message: `${when} tarihli görüşmeniz uzmanınız tarafından iptal edildi.`,
        read: false,
        createdAt: new Date().toISOString(),
        sessionId: session.id,
        sessionType: type,
        startsAt: session.date,
      }
      pushMemberNotification(data, staffCancelNotif)
      const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
      if (!saved.ok) return saved
      await expoPushMember(admin, memberRow.id, staffCancelNotif, staffRow.id)
      return { ok: true, session: sessions[idx], outcome: 'cancelled', actor: 'staff' }
    }
    if (adminUser) {
      sessions[idx] = finalizeCancelled(session, 'admin_cancel', authUser.id)
      const adminForceNotif = {
        id: `n-cancel-admin-${Date.now().toString(36)}`,
        type: 'appointment',
        title: 'Randevunuz iptal edildi',
        message: `${when} tarihli görüşmeniz yönetim tarafından iptal edildi.`,
        read: false,
        createdAt: new Date().toISOString(),
        sessionId: session.id,
        sessionType: type,
        startsAt: session.date,
      }
      pushMemberNotification(data, adminForceNotif)
      const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
      if (!saved.ok) return saved
      await expoPushMember(admin, memberRow.id, adminForceNotif, authUser.id)
      return { ok: true, session: sessions[idx], outcome: 'cancelled', actor: 'admin' }
    }
    return { ok: false, error: 'Bu danışan için yetkiniz yok.' }
  }

  // Üye self-servis
  if (status === 'pending') {
    sessions[idx] = finalizeCancelled(session, 'pending_withdraw', actorId)
    const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
    if (!saved.ok) return saved
    return { ok: true, session: sessions[idx], outcome: 'cancelled', actor: 'member' }
  }

  if (!['scheduled', 'rescheduled'].includes(status)) {
    return { ok: false, error: 'Bu randevu için iptal talebi gönderilemez.' }
  }

  if (!hasMemberNotice(session)) {
    return { ok: false, error: 'Randevuya 24 saatten az kaldığı için iptal yapılamaz.' }
  }

  sessions[idx] = {
    ...session,
    status: 'cancel_pending',
    cancelRequestedAt: new Date().toISOString(),
    cancelRequestedBy: 'member',
    statusBeforeCancel: status,
  }
  const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
  if (!saved.ok) return saved

  try {
    await pushStaffNotification(admin, assignedId, {
      id: `n-cancel-req-${Date.now().toString(36)}`,
      type: 'appointment',
      title: 'İptal talebi',
      message: `${memberRow.name || 'Danışan'} — ${when} iptal onayı bekliyor`,
      read: false,
      createdAt: new Date().toISOString(),
      memberId: memberRow.id,
      sessionId: session.id,
      sessionType: type,
      startsAt: session.date,
    }, actorId)
  } catch {
    /* opsiyonel */
  }

  return { ok: true, session: sessions[idx], outcome: 'cancel_pending', actor: 'member' }
}

/** Personel: üye iptal talebini onayla / reddet */
export async function respondCancelSession(admin, authUser, {
  memberId,
  sessionId,
  sessionType,
  decision,
}) {
  const dec = String(decision || '').toLowerCase()
  if (!['approve', 'reject'].includes(dec)) {
    return { ok: false, error: 'Geçersiz karar.' }
  }

  const staffRow = await resolveStaffRow(admin, authUser)
  if (!staffRow) return { ok: false, error: 'Personel kaydı bulunamadı.' }

  const loaded = await loadMemberSession(admin, memberId, sessionType, sessionId)
  if (!loaded.ok) return loaded
  const { type, key, memberRow, data, sessions, idx, session } = loaded

  if (String(memberRow[assignColumn(type)] || '') !== String(staffRow.id)) {
    return { ok: false, error: 'Bu danışan için yetkiniz yok.' }
  }
  if ((session.status || '') !== 'cancel_pending') {
    return { ok: false, error: 'Bu randevu iptal onayı bekleyen durumda değil.' }
  }

  const when = formatWhen(session.date)

  let memberNotif = null
  if (dec === 'approve') {
    sessions[idx] = finalizeCancelled(session, 'member_cancel', staffRow.id)
    memberNotif = {
      id: `n-cancel-ok-${Date.now().toString(36)}`,
      type: 'appointment',
      title: 'İptal talebiniz onaylandı',
      message: `${when} tarihli görüşmeniz iptal edildi.`,
      read: false,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      sessionType: type,
      startsAt: session.date,
    }
    pushMemberNotification(data, memberNotif)
  } else {
    sessions[idx] = {
      ...restoreFromCancelRequest(session),
      cancelRespondedBy: staffRow.id,
    }
    memberNotif = {
      id: `n-cancel-no-${Date.now().toString(36)}`,
      type: 'appointment',
      title: 'İptal talebiniz reddedildi',
      message: `${when} tarihli görüşmeniz planlandığı gibi devam ediyor.`,
      read: false,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      sessionType: type,
      startsAt: session.date,
    }
    pushMemberNotification(data, memberNotif)
  }

  const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
  if (!saved.ok) return saved
  await expoPushMember(admin, memberRow.id, memberNotif, staffRow.id)
  return {
    ok: true,
    session: sessions[idx],
    outcome: dec === 'approve' ? 'cancelled' : 'rejected_cancel',
  }
}

/** Admin: personelin 24s-içi iptal talebini onayla / reddet */
export async function respondAdminCancel(admin, authUser, {
  memberId,
  sessionId,
  sessionType,
  decision,
}) {
  const dec = String(decision || '').toLowerCase()
  if (!['approve', 'reject'].includes(dec)) {
    return { ok: false, error: 'Geçersiz karar.' }
  }
  if (!(await isAdminUser(admin, authUser))) {
    return { ok: false, error: 'Yalnızca yönetim onaylayabilir.' }
  }

  const loaded = await loadMemberSession(admin, memberId, sessionType, sessionId)
  if (!loaded.ok) return loaded
  const { type, key, memberRow, data, sessions, idx, session } = loaded

  if ((session.status || '') !== 'admin_cancel_pending') {
    return { ok: false, error: 'Bu randevu yönetim iptal onayı bekleyen durumda değil.' }
  }

  const when = formatWhen(session.date)

  let memberNotif = null
  if (dec === 'approve') {
    sessions[idx] = finalizeCancelled(session, 'staff_cancel', authUser.id)
    memberNotif = {
      id: `n-admin-cancel-ok-${Date.now().toString(36)}`,
      type: 'appointment',
      title: 'Randevunuz iptal edildi',
      message: `${when} tarihli görüşmeniz iptal edildi.`,
      read: false,
      createdAt: new Date().toISOString(),
      sessionId: session.id,
      sessionType: type,
      startsAt: session.date,
    }
    pushMemberNotification(data, memberNotif)
  } else {
    sessions[idx] = {
      ...restoreFromCancelRequest(session),
      cancelRespondedBy: authUser.id,
    }
  }

  const saved = await saveSessions(admin, memberRow.id, data, key, sessions)
  if (!saved.ok) return saved
  if (memberNotif) await expoPushMember(admin, memberRow.id, memberNotif, authUser.id)
  return {
    ok: true,
    session: sessions[idx],
    outcome: dec === 'approve' ? 'cancelled' : 'rejected_admin_cancel',
  }
}
