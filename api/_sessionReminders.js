/**
 * Saatlik randevu hatırlatmaları — T-24s ve T-1s (±30 dk pencere).
 * In-app liste (üye + personel) + Expo. Idempotency: session.waReminders.{ t24, t1 }
 * (alan adı tarihî; yeniden adlandırma aynı pencereyi tekrar tetikler).
 *
 * Tetikleyici: GitHub Actions saatlik (Hobby Vercel cron günde 1 kez; T-1s yakalanmaz).
 * Endpoint: GET /api/ai-blog-generate?task=session-reminders  (CRON_SECRET)
 */

import { sendExpoPushToMember, sendExpoPushToStaff } from './_expoPush.js'

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

/** Service-role atomik yazım — JWT is_admin() burada false. */
async function appendStaffNotificationAtomic(admin, staffId, notification) {
  if (!admin || !staffId || !notification?.title) return
  const { error } = await admin.rpc('append_outbound_notification', {
    p_audience: 'staff',
    p_user_id: staffId,
    p_notification: notification,
  })
  if (error) throw error
}

function queueReminder(admin, {
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
  const pending = []

  if (memberId && memberData) {
    const title = windowKey === 't1' ? 'Randevunuz 1 saat sonra' : 'Randevunuz yarın'
    const memberNotif = buildNotif(
      'appointment',
      title,
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt, reminder: windowKey },
    )
    appendNote(memberData, memberNotif)
    pending.push({ kind: 'member', id: memberId, notification: memberNotif })
  }

  if (staffId) {
    const staffNotif = buildNotif(
      'appointment',
      windowKey === 't1' ? 'Görüşme 1 saat sonra' : 'Görüşme yarın',
      `${memberName || 'Danışan'} — ${when}`,
      { memberId, sessionId, sessionType, startsAt, reminder: windowKey },
    )
    pending.push({ kind: 'staff', id: staffId, notification: staffNotif })
  }

  return pending
}

async function fanoutReminder(admin, item) {
  if (item.kind === 'staff') {
    await appendStaffNotificationAtomic(admin, item.id, item.notification)
    await sendExpoPushToStaff(admin, item.id, {
      ...item.notification,
      audience: 'staff',
    })
    return
  }
  await sendExpoPushToMember(admin, item.id, item.notification)
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
    const pendingFanout = []

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
            const queued = queueReminder(admin, {
              memberId: row.id,
              staffId: resolveStaffId(row, sessionType),
              sessionType,
              startsAt: startsAt.toISOString(),
              sessionId: session.id,
              windowKey,
              memberName: row.name,
              memberData: data,
            })
            pendingFanout.push(...queued)
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
      if (updErr) {
        errors.push(`${row.id}: ${updErr.message}`)
        continue
      }
    }

    for (const item of pendingFanout) {
      try {
        await fanoutReminder(admin, item)
      } catch (err) {
        errors.push(`${row.id}/expo/${item.kind}: ${err?.message || err}`)
      }
    }
  }

  return { ok: true, scanned, sent, marked, errors }
}
