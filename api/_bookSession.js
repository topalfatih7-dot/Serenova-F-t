/**
 * Self-servis randevu — book_staff_session RPC ile aynı kurallar + doktor tek seferlik limiti.
 * HTTP handler: POST /api/auth { action: 'book-session', ... }
 */
import { countUsedDoctorSessions, syncMemberPackages } from './_memberPackages.js'

const TZ = 'Europe/Istanbul'
const SESSION_KEYS = { coach: 'coachSessions', dietitian: 'dietitianSessions', doctor: 'doctorSessions' }
const TITLES = { coach: 'Koç Görüşmesi', dietitian: 'Diyetisyen Görüşmesi', doctor: 'Doktor Görüşmesi' }

function istanbulParts(date) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return {
    dow: dowMap[parts.weekday] ?? 0,
    hour: parts.hour,
  }
}

function sessionKey(type) {
  return SESSION_KEYS[type] || 'dietitianSessions'
}

function activeStatuses() {
  return new Set(['scheduled', 'rescheduled'])
}

function parseSessionDate(s) {
  const raw = s?.date
  if (!raw || !/^\d{4}-\d{2}-\d{2}T/.test(raw)) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function monthKey(date) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' })
  return fmt.format(date)
}

function resolveStaffId(type, memberRow) {
  if (type === 'coach') return memberRow.assigned_coach_id ?? null
  if (type === 'dietitian') return memberRow.assigned_dietitian_id ?? null
  return memberRow.assigned_doctor_id ?? null
}

function bookingLimit(type, pkg) {
  if (type === 'coach') {
    let limit = Number(pkg.coachMeetingsPerMonth) || 0
    if (!limit) limit = (Number(pkg.coachMeetingsPerWeek) || 0) * 4
    return { limit, oneTime: false }
  }
  if (type === 'doctor') {
    const oneTimeTotal = Number(pkg.doctorSessionsTotal) || 0
    if (oneTimeTotal > 0) return { limit: oneTimeTotal, oneTime: true }
    return { limit: Number(pkg.doctorMeetingsPerMonth) || 0, oneTime: false }
  }
  return { limit: Number(pkg.dietitianMeetingsPerMonth) || 0, oneTime: false }
}

function memberFromRow(row) {
  const data = row.data || {}
  const {
    assignedCoachId: _c,
    assignedDietitianId: _d,
    assignedDoctorId: _doc,
    ...rest
  } = data
  return syncMemberPackages({
    id: row.id,
    membership: row.membership,
    assignedCoachId: row.assigned_coach_id ?? null,
    assignedDietitianId: row.assigned_dietitian_id ?? null,
    assignedDoctorId: row.assigned_doctor_id ?? null,
    ...rest,
  })
}

export async function bookSessionForMember(admin, userId, type, startsAtISO, duration = 30) {
  const sessionType = String(type || '').toLowerCase()
  if (!['coach', 'dietitian', 'doctor'].includes(sessionType)) {
    return { ok: false, error: 'Geçersiz randevu türü.' }
  }

  const startsAt = new Date(startsAtISO)
  if (Number.isNaN(startsAt.getTime()) || startsAt <= new Date()) {
    return { ok: false, error: 'Geçmiş bir zaman seçilemez.' }
  }

  const { data: memberRow, error: memberErr } = await admin.from('members').select('*').eq('id', userId).maybeSingle()
  if (memberErr || !memberRow) return { ok: false, error: 'Üye kaydı bulunamadı.' }

  const member = memberFromRow(memberRow)
  const pkg = member.packageConfig || {}
  const staffId = resolveStaffId(sessionType, memberRow)
  if (!staffId) return { ok: false, error: 'Bu randevu türü için atanmış bir uzman yok.' }

  const { data: staffRow, error: staffErr } = await admin.from('staff').select('id, name, data').eq('id', staffId).maybeSingle()
  if (staffErr || !staffRow) return { ok: false, error: 'Uzman bulunamadı.' }

  const avail = staffRow.data?.availability || {}
  const { dow, hour } = istanbulParts(startsAt)
  const hourKey = `${hour}:00`
  const daySlots = avail[String(dow)] || avail[dow]
  if (!Array.isArray(daySlots) || !daySlots.includes(hourKey)) {
    return { ok: false, error: 'Seçilen saat uzmanın müsaitliği dışında.' }
  }

  const key = sessionKey(sessionType)
  const startsIso = startsAt.toISOString()

  const assignColumn = sessionType === 'coach'
    ? 'assigned_coach_id'
    : sessionType === 'dietitian'
      ? 'assigned_dietitian_id'
      : 'assigned_doctor_id'

  const { data: peerRows, error: peerErr } = await admin
    .from('members')
    .select('data')
    .eq(assignColumn, staffId)
  if (peerErr) return { ok: false, error: peerErr.message }

  let slotTaken = false
  for (const m of peerRows || []) {
    const sessions = m.data?.[key] || []
    for (const s of sessions) {
      if (!activeStatuses().has(s?.status || 'scheduled')) continue
      const d = parseSessionDate(s)
      if (d && d.toISOString() === startsIso) {
        slotTaken = true
        break
      }
    }
    if (slotTaken) break
  }
  if (slotTaken) return { ok: false, error: 'Bu saat dolu, lütfen başka bir slot seçin.' }

  const { limit, oneTime } = bookingLimit(sessionType, pkg)
  const mySessions = memberRow.data?.[key] || []

  if (limit > 0) {
    if (oneTime) {
      const used = countUsedDoctorSessions(member)
      if (used >= limit) {
        return { ok: false, error: `Doktor görüşme hakkınız kullanıldı (${used}/${limit}).` }
      }
    } else {
      const targetMonth = monthKey(startsAt)
      const used = mySessions.filter((s) => {
        if (!activeStatuses().has(s?.status || 'scheduled')) return false
        const d = parseSessionDate(s)
        return d && monthKey(d) === targetMonth
      }).length
      if (used >= limit) {
        return { ok: false, error: `Bu ay için randevu hakkınız doldu (${used}/${limit}).` }
      }
    }
  }

  const session = {
    id: `bk-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    type: sessionType,
    title: TITLES[sessionType],
    date: startsAt.toISOString(),
    duration: Math.max(Number(duration) || 30, 15),
    status: 'scheduled',
    coach: staffRow.name || '',
    bookedBy: 'member',
    createdAt: new Date().toISOString(),
  }

  const data = { ...(memberRow.data || {}) }
  const sessions = [...(data[key] || []), session]
  data[key] = sessions

  const { error: updErr } = await admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (updErr) return { ok: false, error: updErr.message }

  try {
    const when = new Intl.DateTimeFormat('tr-TR', {
      timeZone: TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(startsAt)
    const notification = {
      id: `n-appointment-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      type: 'appointment',
      title: 'Yeni randevu',
      message: `${memberRow.name || 'Danışan'} — ${when}`,
      read: false,
      createdAt: new Date().toISOString(),
      memberId: userId,
      sessionId: session.id,
      sessionType,
      startsAt: session.date,
    }
    const staffData = { ...(staffRow.data || {}) }
    const prev = Array.isArray(staffData.notifications) ? staffData.notifications : []
    staffData.notifications = [notification, ...prev].slice(0, 100)
    await admin
      .from('staff')
      .update({ data: staffData })
      .eq('id', staffId)

    const { notifyAppointmentConfirmed } = await import('./_whatsappEvents.js')
    await notifyAppointmentConfirmed(admin, {
      memberId: userId,
      staffId,
      sessionType,
      startsAt: session.date,
      sessionId: session.id,
      memberName: memberRow.name,
      staffName: staffRow.name,
    })
  } catch {
    /* randevu oluştu; bildirim opsiyonel */
  }

  return { ok: true, session }
}
