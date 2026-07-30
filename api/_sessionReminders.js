/**
 * Saatlik randevu hatırlatmaları — T-24s ve T-1s (±30 dk pencere).
 * Idempotency: session.waReminders.{ t24, t1 }
 */

import {
  notifySessionReminder,
  SESSION_KEYS,
} from './_whatsappEvents.js'

const ACTIVE = new Set(['scheduled', 'rescheduled'])
const WINDOW_MS = 30 * 60 * 1000
const T24_MS = 24 * 60 * 60 * 1000
const T1_MS = 60 * 60 * 1000

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
            const result = await notifySessionReminder(admin, {
              memberId: row.id,
              staffId: resolveStaffId(row, sessionType),
              sessionType,
              startsAt: startsAt.toISOString(),
              sessionId: session.id,
              windowKey,
            })
            waReminders[windowKey] = new Date().toISOString()
            sessionDirty = true
            marked += 1
            sent += (result.results || []).filter((r) => r?.ok && !r.skipped).length
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
