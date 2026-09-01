/**
 * Sunucu tarafı habit hatırlatmaları — Expo push (uygulama kapalıyken de gelir).
 *   • Öğün / antrenman: başlamadan 30 dk önce (ücretli üye + program).
 *   • Günlük sabit saat: sabah motivasyon + günün ipucu, akşam değerlendirme.
 *
 * OS-only (in-app listeye yazılmaz — engagement reminder pariti).
 * Idempotency: members.data.pushLog[dateStr] = [key,...] (yalnız başarıdan sonra).
 * Tetik: pg_cron (10 dk) → /api/ai-blog-generate?task=habit-reminders (CRON_SECRET).
 */

import { sendExpoPushToMember } from './_expoPush.js'
import { resolveDailyTip } from './_dailyTip.js'
import {
  getProgramEntriesForDate,
  groupEntriesByMeal,
  splitEntriesByType,
  isMealCompleted,
  completionKey,
  mealShortLabel,
  parseStartHM,
  istanbulParts,
  istanbulLocalToUtcMs,
} from './_programSchedule.js'

const WINDOW_MS = 10 * 60 * 1000 // ±10 dk — cron 10 dk'da bir
const REMIND_BEFORE_MS = 30 * 60 * 1000 // öğün/antrenmandan 30 dk önce
const PAGE_SIZE = 200
const PUSHLOG_KEEP_DAYS = 3

/** Günlük sabit saat slotları (İstanbul). */
const DAILY_SLOTS = [
  { key: 'daily_morning', hour: 9, minute: 0, kind: 'morning' },
  { key: 'daily_evening', hour: 20, minute: 30, kind: 'evening' },
]

const MORNING_TITLES = ['Günaydın! 💪', 'Yeni bir güne başla 🌅', 'Bugün senin günün ✨']
const EVENING_TITLES = ['Günü değerlendir 🌙', 'Bugünü kapat 📊', 'Hedeflerini kontrol et ✅']
const EVENING_BODIES = [
  'Öğün ve antrenman hedeflerini tamamladın mı? Panelden bir bak.',
  'Bugünkü planını gözden geçir; küçük adımlar büyük fark yaratır.',
  'Su, öğün ve antrenman — bugünü nasıl geçirdin? Panelde kontrol et.',
]

function pick(arr, dateStr) {
  const d = Number((dateStr || '').slice(8, 10)) || 1
  return arr[d % arr.length]
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

function pushLogHas(data, dateStr, key) {
  const log = data?.pushLog
  return Boolean(log && Array.isArray(log[dateStr]) && log[dateStr].includes(key))
}

function pushLogMark(data, dateStr, key) {
  if (!data.pushLog || typeof data.pushLog !== 'object') data.pushLog = {}
  if (!Array.isArray(data.pushLog[dateStr])) data.pushLog[dateStr] = []
  if (!data.pushLog[dateStr].includes(key)) data.pushLog[dateStr].push(key)
}

/** Eski günleri buda (data şişmesin). */
function prunePushLog(data, todayStr) {
  if (!data.pushLog || typeof data.pushLog !== 'object') return
  const keep = new Set()
  const base = new Date(`${todayStr}T00:00:00Z`).getTime()
  for (let i = 0; i < PUSHLOG_KEEP_DAYS; i += 1) {
    const d = new Date(base - i * 86400000)
    keep.add(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`,
    )
  }
  for (const k of Object.keys(data.pushLog)) {
    if (!keep.has(k)) delete data.pushLog[k]
  }
}

function remindersEnabled(settings) {
  if (!settings) return true
  if (settings.pushNotifs === false) return false
  if (settings.reminderNotifs === false) return false
  return true
}

function withinWindow(targetMs, nowMs) {
  return Math.abs(nowMs - targetMs) <= WINDOW_MS
}

/**
 * Bir üye için o an düşmesi gereken habit hatırlatmalarını hesapla.
 * @returns {{ key: string, notification: object }[]}
 */
export function computeMemberHabitReminders({
  memberObj,
  programs,
  now,
  todayStr,
  nowMs,
  dailyTip,
  isPaid,
}) {
  const out = []
  const data = memberObj.__data || {}
  const settings = memberObj.settings || {}
  if (!remindersEnabled(settings)) return out

  // 1) Günlük sabit saat slotları
  for (const slot of DAILY_SLOTS) {
    if (pushLogHas(data, todayStr, slot.key)) continue
    const targetMs = istanbulLocalToUtcMs(todayStr, slot.hour, slot.minute)
    if (!withinWindow(targetMs, nowMs)) continue
    if (slot.kind === 'morning') {
      out.push({
        key: slot.key,
        notification: buildNotif(
          'reminder',
          pick(MORNING_TITLES, todayStr),
          dailyTip || 'Bugün küçük bir adım at: bir bardak su, kısa bir yürüyüş, dengeli bir öğün.',
          { action: 'habit_daily_tip' },
        ),
      })
    } else {
      out.push({
        key: slot.key,
        notification: buildNotif(
          'reminder',
          pick(EVENING_TITLES, todayStr),
          pick(EVENING_BODIES, todayStr),
          { action: 'habit_evening' },
        ),
      })
    }
  }

  // 2) Öğün / antrenman — yalnız ücretli üye + program
  if (isPaid && programs?.length) {
    const completed = data.completedActivities || {}
    const entries = getProgramEntriesForDate(programs, todayStr, memberObj)
    const { workout, nutrition } = splitEntriesByType(entries)
    const mealGroups = groupEntriesByMeal(
      nutrition.filter((e) => normalizeSafe(e.mealType) !== 'note'),
    )

    for (const g of mealGroups) {
      if (isMealCompleted(completed, todayStr, g.mealType, g.entries)) continue
      const starts = g.entries
        .map((e) => parseStartHM(e.start))
        .filter(Boolean)
        .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute))
      if (!starts.length) continue
      const hm = starts[0]
      const startMs = istanbulLocalToUtcMs(todayStr, hm.hour, hm.minute)
      const targetMs = startMs - REMIND_BEFORE_MS
      if (nowMs > startMs) continue // öğün saati geçmişse hatırlatma
      if (!withinWindow(targetMs, nowMs)) continue
      const key = `meal_${g.mealType}`
      if (pushLogHas(data, todayStr, key)) continue
      out.push({
        key,
        notification: buildNotif(
          'reminder',
          `${mealShortLabel(g.mealType)} saati yaklaşıyor 🍽️`,
          `${mealShortLabel(g.mealType)} saatine ~30 dakika kaldı. Planını aç ve hazırlan.`,
          { action: 'habit_program_meal' },
        ),
      })
    }

    const seenWo = new Set()
    for (const e of workout) {
      if (!e.id) continue
      if (completed[todayStr]?.includes(completionKey(todayStr, e.id))) continue
      const hm = parseStartHM(e.start)
      if (!hm) continue
      const startMs = istanbulLocalToUtcMs(todayStr, hm.hour, hm.minute)
      const targetMs = startMs - REMIND_BEFORE_MS
      if (nowMs > startMs) continue
      if (!withinWindow(targetMs, nowMs)) continue
      const key = `wo_${e.id}`
      if (seenWo.has(key) || pushLogHas(data, todayStr, key)) continue
      seenWo.add(key)
      out.push({
        key,
        notification: buildNotif(
          'reminder',
          'Antrenman saati yaklaşıyor 🏋️',
          `${e.programTitle ? `"${e.programTitle}" ` : ''}antrenmanına ~30 dakika kaldı. Hazırlan!`,
          { action: 'habit_program_workout' },
        ),
      })
    }
  }

  return out
}

function normalizeSafe(mealType) {
  if (mealType === 'snack') return 'snack_morning'
  return mealType || 'note'
}

function isPaidRow(row) {
  return String(row.membership || '') !== 'free' && row.membership != null
}

/**
 * @returns {{ ok, scanned, sent, marked, pages, errors }}
 */
export async function runHabitRemindersBatch(admin, { now = new Date() } = {}) {
  const { dateStr: todayStr } = istanbulParts(now)
  const nowMs = now.getTime()

  let dailyTip = ''
  try {
    const tip = await resolveDailyTip({})
    if (tip?.tip) dailyTip = String(tip.tip).trim()
  } catch {
    dailyTip = ''
  }

  let scanned = 0
  let sent = 0
  let marked = 0
  let pages = 0
  const errors = []

  let from = 0
  while (true) {
    const { data: members, error } = await admin
      .from('members')
      .select('id, name, membership, data')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message || 'Üyeler okunamadı')
    pages += 1
    if (!members || !members.length) break

    const paidIds = members.filter(isPaidRow).map((m) => m.id)
    const programsByMember = new Map()
    if (paidIds.length) {
      const { data: progRows, error: progErr } = await admin
        .from('programs')
        .select('id, member_id, staff_id, data')
        .in('member_id', paidIds)
      if (progErr) errors.push(`programs: ${progErr.message}`)
      for (const row of progRows || []) {
        const prog = { ...(row.data || {}), id: row.id, memberId: row.member_id, staffId: row.staff_id }
        if (!programsByMember.has(row.member_id)) programsByMember.set(row.member_id, [])
        programsByMember.get(row.member_id).push(prog)
      }
    }

    for (const row of members) {
      scanned += 1
      const data = { ...(row.data || {}) }
      const memberObj = { ...data, __data: data, id: row.id, name: row.name, membership: row.membership }
      const reminders = computeMemberHabitReminders({
        memberObj,
        programs: programsByMember.get(row.id) || [],
        now,
        todayStr,
        nowMs,
        dailyTip,
        isPaid: isPaidRow(row),
      })
      if (!reminders.length) continue

      let dirty = false
      for (const item of reminders) {
        try {
          const expo = await sendExpoPushToMember(admin, row.id, item.notification)
          if (expo && expo.ok !== false) {
            pushLogMark(data, todayStr, item.key)
            if (!expo.skipped) sent += 1
            marked += 1
            dirty = true
          } else {
            errors.push(`${row.id}/${item.key}: ${expo?.error || 'expo failed'}`)
          }
        } catch (err) {
          errors.push(`${row.id}/${item.key}: ${err?.message || err}`)
        }
      }

      if (dirty) {
        prunePushLog(data, todayStr)
        const { error: updErr } = await admin
          .from('members')
          .update({ data, updated_at: new Date().toISOString() })
          .eq('id', row.id)
        if (updErr) errors.push(`${row.id}: ${updErr.message}`)
      }
    }

    if (members.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return { ok: errors.length === 0, scanned, sent, marked, pages, errors, todayStr }
}
