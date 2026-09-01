/**
 * Saatlik randevu hatırlatmaları — T-24s ve T-1s (±30 dk pencere).
 * In-app liste (üye + personel) + Expo. Idempotency: session.waReminders.{ t24, t1 }
 * (alan adı tarihî; yeniden adlandırma aynı pencereyi tekrar tetikler).
 *
 * Dedup işareti yalnızca Expo (veya bilinçli skip) başarısından sonra yazılır.
 * Hata varsa ok:false — GitHub Actions yeşil boyamaz.
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
const PAGE_SIZE = 200

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

function queueReminder({
  memberId,
  staffId,
  sessionType,
  startsAt,
  sessionId,
  windowKey,
  memberName,
  sessionKey,
  sessionIndex,
} = {}) {
  const when = formatWhenTr(startsAt)
  const roleLabel = sessionTypeLabel(sessionType)
  const pending = []

  if (memberId) {
    const title = windowKey === 't1' ? 'Randevunuz 1 saat sonra' : 'Randevunuz yarın'
    const memberNotif = buildNotif(
      'appointment',
      title,
      `${roleLabel} görüşmesi — ${when}`,
      { sessionId, sessionType, startsAt, reminder: windowKey },
    )
    pending.push({
      kind: 'member',
      id: memberId,
      notification: memberNotif,
      sessionKey,
      sessionIndex,
      windowKey,
    })
  }

  if (staffId) {
    const staffNotif = buildNotif(
      'appointment',
      windowKey === 't1' ? 'Görüşme 1 saat sonra' : 'Görüşme yarın',
      `${memberName || 'Danışan'} — ${when}`,
      { memberId, sessionId, sessionType, startsAt, reminder: windowKey },
    )
    pending.push({
      kind: 'staff',
      id: staffId,
      notification: staffNotif,
      sessionKey,
      sessionIndex,
      windowKey,
    })
  }

  return pending
}

function expoDelivered(result) {
  if (!result) return false
  if (result.ok === false) return false
  return true
}

async function fanoutReminder(admin, item, pushMember, pushStaff) {
  if (item.kind === 'staff') {
    await appendStaffNotificationAtomic(admin, item.id, item.notification)
    const expo = await pushStaff(admin, item.id, {
      ...item.notification,
      audience: 'staff',
    })
    if (!expoDelivered(expo)) {
      throw new Error(expo?.error || 'staff expo failed')
    }
    return expo
  }
  const expo = await pushMember(admin, item.id, item.notification)
  if (!expoDelivered(expo)) {
    throw new Error(expo?.error || 'member expo failed')
  }
  return expo
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

function markSessionWindow(data, sessionKey, sessionIndex, windowKey) {
  const sessions = Array.isArray(data[sessionKey]) ? [...data[sessionKey]] : []
  const session = sessions[sessionIndex]
  if (!session) return
  sessions[sessionIndex] = {
    ...session,
    waReminders: {
      ...(session.waReminders || {}),
      [windowKey]: new Date().toISOString(),
    },
  }
  data[sessionKey] = sessions
}

async function fetchPaidMembersPage(admin, from, size) {
  // NULL membership <> 'free' SQL'de düşer; IS DISTINCT FROM ile al.
  const { data, error } = await admin
    .from('members')
    .select('id, name, membership, assigned_coach_id, assigned_dietitian_id, assigned_doctor_id, data')
    .or('membership.is.null,membership.neq.free')
    .order('id', { ascending: true })
    .range(from, from + size - 1)
  if (error) throw new Error(error.message || 'Üyeler okunamadı')
  return (data || []).filter((row) => String(row.membership || '') !== 'free')
}

/**
 * @returns {{ ok: boolean, scanned: number, sent: number, marked: number, pages: number, errors: string[] }}
 */
export async function runSessionRemindersBatch(admin, {
  now = new Date(),
  pushMember = sendExpoPushToMember,
  pushStaff = sendExpoPushToStaff,
} = {}) {
  const nowMs = now.getTime()

  let scanned = 0
  let sent = 0
  let marked = 0
  let pages = 0
  const errors = []

  let from = 0
  while (true) {
    const members = await fetchPaidMembersPage(admin, from, PAGE_SIZE)
    pages += 1
    if (!members.length) break

    for (const row of members) {
      const data = { ...(row.data || {}) }
      let dirty = false
      const pendingFanout = []

      for (const [sessionType, key] of Object.entries(SESSION_KEYS)) {
        const sessions = Array.isArray(data[key]) ? [...data[key]] : []

        for (let i = 0; i < sessions.length; i += 1) {
          const session = sessions[i]
          if (!ACTIVE.has(session?.status || 'scheduled')) continue
          const startsAt = parseSessionDate(session)
          if (!startsAt || startsAt.getTime() <= nowMs) continue

          scanned += 1
          const waReminders = { ...(session.waReminders || {}) }

          for (const [windowKey, offsetMs] of [['t24', T24_MS], ['t1', T1_MS]]) {
            if (waReminders[windowKey]) continue
            if (!inWindow(startsAt, offsetMs, nowMs)) continue
            pendingFanout.push(...queueReminder({
              memberId: row.id,
              staffId: resolveStaffId(row, sessionType),
              sessionType,
              startsAt: startsAt.toISOString(),
              sessionId: session.id,
              windowKey,
              memberName: row.name,
              sessionKey: key,
              sessionIndex: i,
            }))
          }
        }
      }

      const byWindow = new Map()
      for (const item of pendingFanout) {
        const stamp = `${item.sessionKey}:${item.sessionIndex}:${item.windowKey}`
        const list = byWindow.get(stamp) || []
        list.push(item)
        byWindow.set(stamp, list)
      }

      for (const [stamp, items] of byWindow) {
        try {
          for (const item of items) {
            await fanoutReminder(admin, item, pushMember, pushStaff)
            if (item.kind === 'member') appendNote(data, item.notification)
          }
          const first = items[0]
          markSessionWindow(data, first.sessionKey, first.sessionIndex, first.windowKey)
          marked += 1
          sent += 1
          dirty = true
        } catch (err) {
          errors.push(`${row.id}/expo/${stamp}: ${err?.message || err}`)
        }
      }

      if (dirty) {
        const { error: updErr } = await admin
          .from('members')
          .update({ data, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (updErr) {
          errors.push(`${row.id}: ${updErr.message}`)
        }
      }
    }

    if (members.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return {
    ok: errors.length === 0,
    scanned,
    sent,
    marked,
    pages,
    errors,
  }
}
