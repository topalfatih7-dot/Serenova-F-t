/**
 * Sunucu tarafı üye paket yetkileri (AI kalori API guard).
 * Client `src/utils/memberPackages.js` ile aynı kurallar — DB plans.entitlements + legacy.
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'
import {
  loadPlansById,
  planHasManualCalorie,
  planHasPhotoCalorie,
  isOneTimePlanId,
  isLegacyPaidPlanId,
} from './_planEntitlements.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function isPaidMembership(id) {
  if (!id || id === 'free') return false
  return isLegacyPaidPlanId(id) || id.length > 0
}

function isPackageEntryActive(pkg, plan = null, now = today()) {
  if (!pkg || pkg.status !== 'active') return false
  if (isOneTimePlanId(pkg.planId, plan) || pkg.packageConfig?.billingType === 'one_time') return true
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
      expiresAt: membership === 'doktor' ? null : (data.premiumExpiresAt || null),
      packageConfig: data.packageConfig || null,
    }]
  }
  const ids = active
    .filter((p) => isPackageEntryActive(p))
    .map((p) => p.planId)
    .filter(Boolean)
  return ids.length ? ids : [membership || 'free']
}

export async function memberRowHasManualCalorieAccess(row, plansById = null) {
  const ids = activePlanIdsFromRow(row)
  return ids.some((id) => planHasManualCalorie(id, plansById?.get(id) || null))
}

export async function memberRowHasPhotoCalorieAccess(row, plansById = null) {
  const ids = activePlanIdsFromRow(row)
  return ids.some((id) => planHasPhotoCalorie(id, plansById?.get(id) || null))
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

  const plansById = await loadPlansById(admin)
  const allowed = photo
    ? await memberRowHasPhotoCalorieAccess(data, plansById)
    : await memberRowHasManualCalorieAccess(data, plansById)

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
