/**
 * Sunucu tarafı üye paket yetkileri (AI kalori API guard).
 * Client `src/utils/memberPackages.js` ile aynı kurallar — kopya tutulur (api→src import yok).
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'

const PHOTO_CALORIE_PLANS = new Set(['diyet', 'spor', 'vip', 'platinum', 'premium'])
const MANUAL_CALORIE_EXCLUDE = new Set(['free', 'doktor', 'kurucu'])
const PAID = new Set(['eko', 'diyet', 'spor', 'doktor', 'vip', 'gumus', 'altin', 'platinum', 'premium', 'kurucu'])

function today() {
  return new Date().toISOString().slice(0, 10)
}

function isPaidMembership(id) {
  return PAID.has(id)
}

function isOneTimePlan(planId) {
  return planId === 'doktor'
}

function isPackageEntryActive(pkg, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePlan(pkg.planId) || pkg.packageConfig?.billingType === 'one_time') return true
  if (!pkg.expiresAt) return true
  return pkg.expiresAt >= now
}

function activePlanIdsFromRow(row) {
  const data = row?.data || {}
  const membership = row?.membership || 'free'
  let active = Array.isArray(data.activePackages) ? data.activePackages : null
  if (!active) {
    if (!isPaidMembership(membership)) return [membership || 'free']
    active = [{
      planId: membership,
      status: 'active',
      expiresAt: isOneTimePlan(membership) ? null : (data.premiumExpiresAt || null),
    }]
  }
  const ids = active.filter((p) => isPackageEntryActive(p)).map((p) => p.planId).filter(Boolean)
  return ids.length ? ids : [membership || 'free']
}

export function memberRowHasManualCalorieAccess(row) {
  return activePlanIdsFromRow(row).some((id) => !MANUAL_CALORIE_EXCLUDE.has(id))
}

export function memberRowHasPhotoCalorieAccess(row) {
  return activePlanIdsFromRow(row).some((id) => PHOTO_CALORIE_PLANS.has(id))
}

/** @returns {{ ok: true, row } | { ok: false, status: number, error: string }} */
export async function requireMemberCalorieAccess(userId, { photo = false } = {}) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return { ok: false, status: 503, error: 'Veritabanı yapılandırması eksik.' }
  }
  if (!userId) {
    return { ok: false, status: 401, error: 'Oturum bulunamadı.' }
  }

  const { data, error } = await admin
    .from('members')
    .select('id, membership, data')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return { ok: false, status: 500, error: 'Üyelik bilgisi okunamadı.' }
  }
  if (!data) {
    return { ok: false, status: 403, error: 'Üye kaydı bulunamadı.' }
  }

  const allowed = photo
    ? memberRowHasPhotoCalorieAccess(data)
    : memberRowHasManualCalorieAccess(data)

  if (!allowed) {
    return {
      ok: false,
      status: 403,
      error: photo
        ? 'Fotoğraflı kalori analizi bu paket kapsamında değil.'
        : 'Manuel kalori analizi bu paket kapsamında değil.',
    }
  }

  return { ok: true, row: data }
}
