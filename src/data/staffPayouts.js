/**
 * Personel hakediş iş kuralları — serbest meslek (hizmet sözleşmesi) modeli.
 * Üye ödemeleri ayrı; bu dosya yalnızca platform → personel hakedişini tanımlar.
 */

/** Tamamlanan ve faturalandırılabilir video görüşme başına net hakediş (TRY) */
export const STAFF_SESSION_RATE_TRY = 500

/** Minimum eşzamanlı görüşme süresi (dakika) — altında hakediş oluşmaz */
export const STAFF_MIN_OVERLAP_MINUTES = 15

/**
 * Ödeme döngüsü (Europe/Istanbul):
 * Cuma 00:00 → sonraki Perşembe 23:59 (görüşme başlangıcı).
 * O pencerenin ödemesi hemen sonraki Cuma.
 * Cuma günü başlayan görüşme o günkü EFT’ye girmez; bir sonraki Cuma’ya yazılır.
 */
export const STAFF_PAYOUT_CYCLE = 'friday_to_thursday_pay_friday'
export const STAFF_PAYOUT_TIMEZONE = 'Europe/Istanbul'

/** Minimum ödeme eşiği — şu an yok; ileride eklenebilir */
export const STAFF_MIN_PAYOUT_THRESHOLD_TRY = 0

export const STAFF_PAYOUT_RULES = {
  /** Yalnızca video görüşme tamamlandığında */
  billableTypes: ['coach_session', 'dietitian_session'],
  /** Program, beslenme listesi vb. için hakediş yok */
  nonBillableTypes: ['nutrition_list', 'training_program', 'program_revision'],
  /** Her iki taraf da videoya katılmalı */
  requireBothParticipants: true,
  /** Personel serbest meslek — bordro değil, fatura beklenir */
  contractorModel: 'freelance',
  invoiceRequired: true,
}

export const STAFF_EARNING_STATUS = {
  pending: 'Onay bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  reversed: 'İptal / iade',
  rejected: 'Reddedildi',
}

export const STAFF_SESSION_TYPE_LABELS = {
  coach_session: 'Koç görüşmesi',
  dietitian_session: 'Diyetisyen görüşmesi',
}

const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const ISO_WEEK_RE = /^(\d{4})-W(\d{2})$/

/** Hakediş satırı tutarı — şimdilik sabit görüşme ücreti */
export function sessionEarningAmount() {
  return STAFF_SESSION_RATE_TRY
}

export function staffSessionTypeLabel(sessionType) {
  return STAFF_SESSION_TYPE_LABELS[sessionType] || 'Görüşme'
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

export function ymdKey({ year, month, day }) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function parseYmdKey(periodKey) {
  const m = String(periodKey || '').match(YMD_RE)
  if (!m) return null
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) }
}

export function addCalendarDays(civil, days) {
  const utc = Date.UTC(civil.year, civil.month - 1, civil.day + days)
  const d = new Date(utc)
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }
}

/** Görüşme anının İstanbul takvim günü ve haftanın günü (0=Paz … 5=Cuma). */
export function istanbulCivilDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (Number.isNaN(date.getTime())) return null
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: STAFF_PAYOUT_TIMEZONE,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]))
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    weekday: DOW[parts.weekday] ?? 0,
  }
}

/**
 * Görüşme başlangıcının düşeceği ödeme Cuma’sı (YYYY-MM-DD, İstanbul).
 * Perşembe → ertesi Cuma; Cuma 00:00 ve sonrası → bir sonraki Cuma.
 */
export function staffPayoutPeriodKey(sessionStartsAt) {
  const civil = istanbulCivilDate(sessionStartsAt)
  if (!civil) return ''
  const daysToAdd = civil.weekday === 5 ? 7 : (5 - civil.weekday + 7) % 7
  return ymdKey(addCalendarDays(civil, daysToAdd))
}

/** Ödeme Cuma’sının tahakkuk penceresi: önceki Cuma → Perşembe. */
export function staffPayoutAccrualWindow(periodKey) {
  const friday = parseYmdKey(periodKey)
  if (!friday) return null
  return {
    start: addCalendarDays(friday, -7),
    end: addCalendarDays(friday, -1),
    payout: friday,
  }
}

function formatYmdTr(civil, options) {
  if (!civil) return '—'
  const utc = new Date(Date.UTC(civil.year, civil.month - 1, civil.day, 12))
  return new Intl.DateTimeFormat('tr-TR', { timeZone: 'UTC', ...options }).format(utc)
}

export function formatStaffPayoutPeriodLabel(periodKey) {
  if (!periodKey) return '—'
  const isoWeek = String(periodKey).match(ISO_WEEK_RE)
  if (isoWeek) return `${isoWeek[1]} · Hafta ${isoWeek[2]}`
  const ymd = parseYmdKey(periodKey)
  if (ymd) {
    return formatYmdTr(ymd, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }
  return periodKey
}

export function formatStaffPayoutWindowLabel(periodKey) {
  const window = staffPayoutAccrualWindow(periodKey)
  if (!window) return ''
  const start = formatYmdTr(window.start, { day: 'numeric', month: 'short' })
  const end = formatYmdTr(window.end, { day: 'numeric', month: 'short' })
  return `${start} – ${end}`
}

export function formatIstanbulDateTime(iso) {
  const date = iso instanceof Date ? iso : new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('tr-TR', {
    timeZone: STAFF_PAYOUT_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const SESSION_LIST_KEYS = ['coachSessions', 'dietitianSessions']

export function findMemberSession(member, sessionId) {
  if (!member || !sessionId) return null
  for (const key of SESSION_LIST_KEYS) {
    const hit = (member[key] || []).find((s) => s?.id === sessionId)
    if (hit) return hit
  }
  return null
}

/** Hakediş satırından personelin göreceği danışan + tarih. */
export function earningMeetingMeta(row, members = []) {
  const member = (members || []).find((m) => m.id === row?.member_id)
  const session = findMemberSession(member, row?.session_id)
  return {
    memberName: row?.member_name || member?.name || 'Danışan',
    startedAt: row?.session_started_at || session?.date || row?.created_at || null,
    overlapMinutes: Number(row?.overlap_minutes || 0),
    sessionType: row?.session_type || '',
    sessionTypeLabel: staffSessionTypeLabel(row?.session_type),
  }
}

export function nextStaffPayoutPeriodKey(now = new Date(), pendingPeriodKeys = []) {
  const ymd = (pendingPeriodKeys || []).filter((k) => YMD_RE.test(String(k || ''))).sort()
  if (ymd.length) return ymd[0]
  const rest = (pendingPeriodKeys || []).filter(Boolean)
  if (rest.length) return rest[0]
  return staffPayoutPeriodKey(now)
}
