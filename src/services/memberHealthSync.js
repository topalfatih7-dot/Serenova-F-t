/**
 * Sağlık testi / paket değişimi sonrası AI program senkronu.
 */

import { isHealthTestComplete } from '../data/healthTest'
import {
  isBasicProgramWindowOpen,
  memberHasAiBasicPrograms,
  memberHasAiEkoPrograms,
  resolveFreeTrialExpiresAt,
} from '../utils/aiBasicPrograms'
import { fetchAiBasicPrograms, fetchAiEkoPrograms } from './aiBasicPrograms'

export function profileReadyForAnalysis(profile) {
  return isHealthTestComplete(profile?.healthTest, profile?.gender, profile?.packageConfig)
}

/**
 * Basic veya Eko üye için uygun AI program üretimini tetikler.
 */
export async function syncMemberHealthAssets(profile, opts = {}) {
  if (!profile?.id) {
    return { synced: false, reason: 'no_profile' }
  }

  if (!profileReadyForAnalysis(profile)) {
    return { synced: false, reason: 'health_test_incomplete' }
  }

  if (profile.membership === 'free') {
    return syncBasicPrograms(profile, opts)
  }

  if (profile.membership === 'eko') {
    return syncEkoPrograms(profile, opts)
  }

  return { synced: false, reason: 'not_eligible' }
}

async function syncBasicPrograms(profile, opts = {}) {
  if (!isBasicProgramWindowOpen(resolveFreeTrialExpiresAt(profile))) {
    return { synced: false, reason: 'window_closed', skipped: 'window_closed' }
  }

  if (memberHasAiBasicPrograms(opts.programs || [])) {
    return { synced: false, reason: 'already_exists', skipped: 'already_exists' }
  }

  const result = await fetchAiBasicPrograms()
  return mapClientResult(result)
}

async function syncEkoPrograms(profile, opts = {}) {
  const force = opts.force === true
  if (!force && memberHasAiEkoPrograms(opts.programs || [])) {
    return { synced: false, reason: 'already_exists', skipped: 'already_exists' }
  }

  if (!profile.premiumExpiresAt || new Date(profile.premiumExpiresAt) <= new Date()) {
    return { synced: false, reason: 'package_expired', skipped: 'package_expired' }
  }

  const result = await fetchAiEkoPrograms({ force })
  return mapClientResult(result)
}

function mapClientResult(result) {
  if (result.skipped) {
    return {
      synced: false,
      reason: result.skipped,
      skipped: result.skipped,
      error: result.error || null,
    }
  }
  if (!result.ok) {
    return {
      synced: false,
      reason: 'ai_error',
      error: result.error || 'AI program üretilemedi',
      timedOut: result.timedOut,
    }
  }
  return {
    synced: Boolean(result.synced),
    reason: result.synced ? 'created' : 'noop',
    programs: result.programs || [],
    cycleStartDate: result.cycleStartDate,
    cycleEndDate: result.cycleEndDate,
    dailyCalories: result.dailyCalories,
  }
}

/** Eko’ya yükseltme sonrası (test varsa) */
export async function syncEkoProgramsIfNeeded(profile, opts = {}) {
  if (profile?.membership !== 'eko') {
    return { synced: false, reason: 'not_eko' }
  }
  return syncMemberHealthAssets(profile, { ...opts, force: opts.force !== false })
}
