import { format, isValid, parseISO, startOfDay, addDays } from 'date-fns'
import {
  isOneTimePlan,
  isPackageEntryActive,
  migrateLegacyToPackages,
} from './memberPackages'
import {
  getDefaultPackageForPlan,
  isPaidMembership,
  packageIncludesCoach,
  packageIncludesDietitian,
} from '../data/membershipPlans'

function toDateStr(date) {
  if (!date) return null
  const d = date instanceof Date ? startOfDay(date) : startOfDay(parseISO(String(date)))
  return isValid(d) ? format(d, 'yyyy-MM-dd') : null
}

/** Aktif paketlerden program türüne uygun tarih aralıkları */
export function getPackageWindowsForProgramType(member, programType) {
  if (!member) return null

  const packages = migrateLegacyToPackages(member).filter((p) => isPackageEntryActive(p))
  const windows = []

  packages.forEach((pkg) => {
    const cfg = {
      ...getDefaultPackageForPlan(pkg.planId),
      ...(pkg.packageConfig || {}),
    }
    const includes = programType === 'nutrition'
      ? packageIncludesDietitian(cfg)
      : programType === 'workout'
        ? packageIncludesCoach(cfg)
        : false
    if (!includes) return

    windows.push({
      startedAt: pkg.startedAt || member.premiumStartedAt || member.joinedAt || '2000-01-01',
      expiresAt: isOneTimePlan(pkg.planId) ? null : (pkg.expiresAt || null),
    })
  })

  if (!windows.length && isPaidMembership(member.membership)) {
    const merged = member.packageConfig || {}
    const includes = programType === 'nutrition'
      ? packageIncludesDietitian(merged)
      : programType === 'workout'
        ? packageIncludesCoach(merged)
        : false
    if (includes) {
      windows.push({
        startedAt: member.premiumStartedAt || member.joinedAt || '2000-01-01',
        expiresAt: member.premiumExpiresAt || null,
      })
    }
  }

  return windows
}

export function isDateInPackageWindows(date, windows) {
  if (windows == null) return true
  if (!windows.length) return false

  const d = toDateStr(date)
  if (!d) return false

  return windows.some((w) => {
    const start = w.startedAt || '2000-01-01'
    if (d < start) return false
    if (w.expiresAt && d > w.expiresAt) return false
    return true
  })
}

/** Personel tarafından gönderilen programlar için paket kapsamı */
export function isStaffProgramVisibleOnDate(program, date, member) {
  if (!program?.staffId) return true
  if (!member) return true

  const programType = program.type === 'nutrition' ? 'nutrition' : 'workout'
  const windows = getPackageWindowsForProgramType(member, programType)
  return isDateInPackageWindows(date, windows)
}

/**
 * AI programlar paket/deneme hakkına bağlıdır (staffId yok → personel kapısından geçmez).
 * ai_eko → yalnızca aktif eko; ai_basic → free + deneme penceresi (varsa).
 */
export function isAiProgramVisibleOnDate(program, date, member) {
  if (!member) return true
  const source = program?.source
  if (source !== 'ai_eko' && source !== 'ai_basic') return true

  const d = toDateStr(date)
  if (!d) return false

  if (source === 'ai_eko') {
    if (member.membership !== 'eko') return false
    const end = toDateStr(member.premiumExpiresAt)
    if (end && d > end) return false
    return true
  }

  // ai_basic
  if (member.membership !== 'free') return false
  const trialEnd = toDateStr(member.freeTrialExpiresAt)
  if (trialEnd && d > trialEnd) return false
  return true
}

/** Takvim / ilerleme: personel + AI paket kapsamı */
export function isProgramVisibleOnDate(program, date, member) {
  if (!program) return false
  if (!member) return true
  if (program.source === 'ai_eko' || program.source === 'ai_basic') {
    return isAiProgramVisibleOnDate(program, date, member)
  }
  return isStaffProgramVisibleOnDate(program, date, member)
}

/** Program listesi: üyenin şu an görme hakkı var mı? */
export function isProgramListedForMember(program, member) {
  if (!program || !member) return Boolean(program)
  if (program.source === 'ai_eko') return member.membership === 'eko'
  if (program.source === 'ai_basic') {
    if (member.membership !== 'free') return false
    if (!member.freeTrialExpiresAt) return true
    return new Date() <= new Date(member.freeTrialExpiresAt)
  }
  return true
}

/** Program oluşturma UI — min/max tarih */
export function getMemberPackageDateRange(member, programType) {
  const windows = getPackageWindowsForProgramType(member, programType)
  if (!windows?.length) return null

  const starts = windows.map((w) => w.startedAt).filter(Boolean).sort()
  const ends = windows.map((w) => w.expiresAt).filter(Boolean).sort()

  return {
    start: starts[0] || format(new Date(), 'yyyy-MM-dd'),
    end: ends.length ? ends[ends.length - 1] : null,
  }
}

export function memberHasProgramTypePackage(member, programType) {
  return (getPackageWindowsForProgramType(member, programType) || []).length > 0
}

/** Tarih seçicileri için min/max (paket + bugün) */
export function getDateInputBounds(packageRange, { cycleLength = 0 } = {}) {
  const today = format(new Date(), 'yyyy-MM-dd')
  if (!packageRange) {
    return { min: today, max: format(addDays(new Date(), 90), 'yyyy-MM-dd') }
  }

  const min = packageRange.start > today ? packageRange.start : today
  let max = packageRange.end || format(addDays(new Date(), 365), 'yyyy-MM-dd')

  if (cycleLength > 1 && packageRange.end) {
    const maxCycleStart = format(addDays(parseISO(packageRange.end), -(cycleLength - 1)), 'yyyy-MM-dd')
    if (maxCycleStart < max) max = maxCycleStart
  }

  return { min, max: max >= min ? max : min }
}

/** Gönderim öncesi: sabit tarihli girdiler paket dışında mı? */
export function findEntriesOutsidePackage(entries = [], member, programType) {
  const windows = getPackageWindowsForProgramType(member, programType)
  if (!windows?.length) return entries

  return entries.filter((entry) => {
    if (!entry.date) return false
    return !isDateInPackageWindows(entry.date, windows)
  })
}
