/**
 * Sağlık testi sonrası senkron — Basic paket için AI diyet + antrenman.
 */

import { isHealthTestComplete } from '../data/healthTest'
import {
  isBasicProgramWindowOpen,
  memberHasAiBasicPrograms,
  resolveJoinedAt,
} from '../utils/aiBasicPrograms'
import { fetchAiBasicPrograms } from './aiBasicPrograms'

export function profileReadyForAnalysis(profile) {
  return isHealthTestComplete(profile?.healthTest, profile?.gender, profile?.packageConfig)
}

/**
 * Basic üye + tamamlanmış sağlık testi → tek sefer AI program üretimi.
 * @param {object} profile — güncel üye profili
 * @param {{ programs?: object[] }} [opts]
 */
export async function syncMemberHealthAssets(profile, opts = {}) {
  if (!profile?.id) {
    return { synced: false, reason: 'no_profile' }
  }

  if (profile.membership !== 'free') {
    return { synced: false, reason: 'not_free' }
  }

  if (!profileReadyForAnalysis(profile)) {
    return { synced: false, reason: 'health_test_incomplete' }
  }

  const joinedAt = resolveJoinedAt(profile)
  if (!isBasicProgramWindowOpen(joinedAt)) {
    return { synced: false, reason: 'window_closed', skipped: 'window_closed' }
  }

  if (memberHasAiBasicPrograms(opts.programs || [])) {
    return { synced: false, reason: 'already_exists', skipped: 'already_exists' }
  }

  const result = await fetchAiBasicPrograms()

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
