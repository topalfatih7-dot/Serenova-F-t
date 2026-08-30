/**
 * Saatlik randevu hatırlatmaları — T-24s ve T-1s (±30 dk pencere).
 * In-app liste (üye + personel). Idempotency: session.waReminders.{ t24, t1 }
 * (alan adı tarihî; yeniden adlandırma aynı pencereyi tekrar tetikler).
 */

const SESSION_KEYS = {
  coach: 'coachSessions',
  dietitian: 'dietitianSessions',
  doctor: 'doctorSessions',
}

const ACTIVE = new Set(['scheduled', 'rescheduled'])
const WINDOW_MS = 30 * 60 * 1000
const T24_MS = 24 * 60 * 60 * 1000
const T1_MS = 60 * 60 * 1000

const ROLE_LABELS = {
  coach: 'Koç',
  dietitian: 'Diyetisyen',
  doctor: 'Doktor',
}

function sessionTypeLabel(type) {
  return ROLE_LABELS[String(type || '').toLowerCase()] || 'Uzman'
}

function formatWhenTr(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso)
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
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

function appendNote(data, notification) {
  if (!data || !notification?.title) return
  const prev = Array.isArray(data.notifications) ? data.notifications : []
  data.notifications = [notification, ...prev].slice(0, 100)
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

async function notifySessionReminder(admin, {
  memberId,
  staffId,
  sessionType,
  startsAt,
  sessionId,
  windowKey,
  memberName,
  memberData,
} = {}) {
  const when = formatWhenTr(startsAt)
  const roleLabel = sessionTypeLabel(sessionType)

  if (memberId && memberData) {
    const title = windowKey === 't1' ? 'Randevunuz 1 saat sonra' : 'Randevunuz yarın'
    appendNote(memberData, buildNotif(
      'appointment',
      title,
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt, reminder: windowKey },
    ))
  }

  if (staffId) {
    await appendStaffNotification(admin, staffId, buildNotif(
      'appointment',
      windowKey === 't1' ? 'Görüşme 1 saat sonra' : 'Görüşme yarın',
      `${memberName || 'Danışan'} — ${when}`,
      { memberId, sessionId, sessionType, startsAt, reminder: windowKey },
    ))
  }

  return { ok: true }
}

function parseSessionDate(s) {
  const raw = s?.date
  if (!raw) return null
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d
}

function inWindow(startsAt, targetOffsetMs, nowMs) {
  const target = startsAt.getTime() - targetOffsetMs
  return Math.abs(nowMs - target) <= WINDOW_MS
}

function resolveStaffId(row, sessionType) {
  if (sessionType === 'coach') return row.assigned_coach_id
  if (sessionType === 'dietitian') return row.assigned_dietitian_id
  if (sessionType === 'doctor') return row.assigned_doctor_id
  return null
}

/**
 * @returns {{ ok: boolean, scanned: number, sent: number, marked: number, errors: string[] }}
 */
export async function runSessionRemindersBatch(admin, { now = new Date() } = {}) {
  const nowMs = now.getTime()
  const { data: members, error } = await admin
    .from('members')
    .select('id, name, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
    .neq('membership', 'free')
    .limit(800)

  if (error) throw new Error(error.message || 'Üyeler okunamadı')

  let scanned = 0
  let sent = 0
  let marked = 0
  const errors = []

  for (const row of members || []) {
    const data = { ...(row.data || {}) }
    let dirty = false

    for (const [sessionType, key] of Object.entries(SESSION_KEYS)) {
      const sessions = Array.isArray(data[key]) ? [...data[key]] : []
      let keyDirty = false

      for (let i = 0; i < sessions.length; i += 1) {
        const session = sessions[i]
        if (!ACTIVE.has(session?.status || 'scheduled')) continue
        const startsAt = parseSessionDate(session)
        if (!startsAt || startsAt.getTime() <= nowMs) continue

        scanned += 1
        const waReminders = { ...(session.waReminders || {}) }
        let sessionDirty = false

        for (const [windowKey, offsetMs] of [['t24', T24_MS], ['t1', T1_MS]]) {
          if (waReminders[windowKey]) continue
          if (!inWindow(startsAt, offsetMs, nowMs)) continue
          try {
            await notifySessionReminder(admin, {
              memberId: row.id,
              staffId: resolveStaffId(row, sessionType),
              sessionType,
              startsAt: startsAt.toISOString(),
              sessionId: session.id,
              windowKey,
              memberName: row.name,
              memberData: data,
            })
            waReminders[windowKey] = new Date().toISOString()
            sessionDirty = true
            marked += 1
            sent += 1
          } catch (err) {
            errors.push(`${row.id}/${session.id}/${windowKey}: ${err?.message || err}`)
          }
        }

        if (sessionDirty) {
          sessions[i] = { ...session, waReminders }
          keyDirty = true
        }
      }

      if (keyDirty) {
        data[key] = sessions
        dirty = true
      }
    }

    if (dirty) {
      const { error: updErr } = await admin
        .from('members')
        .update({ data, updated_at: new Date().toISOString() })
        .eq('id', row.id)
      if (updErr) errors.push(`${row.id}: ${updErr.message}`)
    }
  }

  return { ok: true, scanned, sent, marked, errors }
}
