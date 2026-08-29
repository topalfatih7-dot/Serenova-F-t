import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  getHealthTestLockState,
  resolveOptionalCompletedAtTimestamp,
  needsCoreAnalysisAfterRetake,
  buildRetakeHealthAnalysisReset,
} from '../src/utils/healthTestLock.js'

const MS_PER_DAY = 24 * 60 * 60 * 1000

function daysAgo(n) {
  return new Date(Date.now() - n * MS_PER_DAY).toISOString()
}

const detailedAnalysis = (days) => ({
  analysisStage: 'detailed',
  aiAttemptedAt: daysAgo(days),
  generatedAt: daysAgo(days).slice(0, 10),
  overallScore: 51,
})

describe('getHealthTestLockState', () => {
  it('locks while optional completion is within 14 days', () => {
    const state = getHealthTestLockState({
      healthAnalysis: detailedAnalysis(3),
      detailedComplete: true,
      optionalCompletedAt: daysAgo(3),
    })
    assert.equal(state.fullLock, true)
    assert.equal(state.canRetake, false)
    assert.equal(state.daysLeft >= 1, true)
  })

  it('opens retake after 14 days', () => {
    const state = getHealthTestLockState({
      healthAnalysis: detailedAnalysis(15),
      detailedComplete: true,
      optionalCompletedAt: daysAgo(15),
    })
    assert.equal(state.fullLock, false)
    assert.equal(state.canRetake, true)
    assert.equal(state.locked, false)
  })

  it('does not lock core-only analysis', () => {
    const state = getHealthTestLockState({
      healthAnalysis: { analysisStage: 'core', aiAttemptedAt: daysAgo(20), overallScore: 40 },
      detailedComplete: false,
      optionalCompletedAt: null,
    })
    assert.equal(state.fullLock, false)
    assert.equal(state.canRetake, false)
  })

  it('unlocks after retake even if leftover analysisStage is detailed', () => {
    const state = getHealthTestLockState({
      healthAnalysis: detailedAnalysis(5),
      detailedComplete: false,
      optionalCompletedAt: null,
      retakeAt: daysAgo(1),
    })
    assert.equal(state.fullLock, false)
    assert.equal(state.canRetake, false)
    assert.equal(state.locked, false)
  })

  it('unblocks a leftover detailed stage after retake (Şenol-style)', () => {
    const state = getHealthTestLockState({
      healthAnalysis: {
        analysisStage: 'detailed',
        aiAttemptedAt: '2026-08-22T12:31:18.626Z',
        generatedAt: '2026-08-22',
      },
      detailedComplete: false,
      optionalCompletedAt: null,
      retakeAt: '2026-08-26T17:00:55.168Z',
    })
    assert.equal(state.fullLock, false)
    assert.equal(state.canRetake, false)
  })

  it('re-locks after retake once optionals are completed again', () => {
    const state = getHealthTestLockState({
      healthAnalysis: { analysisStage: 'core', aiAttemptedAt: daysAgo(20), overallScore: 51 },
      detailedComplete: true,
      optionalCompletedAt: daysAgo(0.01),
      retakeAt: daysAgo(1),
    })
    assert.equal(state.fullLock, true)
    assert.equal(state.canRetake, false)
  })
})

describe('needsCoreAnalysisAfterRetake', () => {
  it('is true when retake is after last analysis (Şenol leftover scores)', () => {
    const pending = needsCoreAnalysisAfterRetake(
      {
        analysisStage: 'core',
        aiAttemptedAt: '2026-08-22T12:31:18.626Z',
        overallScore: 51,
      },
      { retakeAt: '2026-08-26T17:00:55.168Z' },
    )
    assert.equal(pending, true)
  })

  it('is false after a new analysis timestamp later than retake', () => {
    const pending = needsCoreAnalysisAfterRetake(
      {
        analysisStage: 'core',
        aiAttemptedAt: '2026-08-27T15:00:00.000Z',
        overallScore: 56,
      },
      { retakeAt: '2026-08-26T17:00:55.168Z' },
    )
    assert.equal(pending, false)
  })

  it('is false without retakeAt', () => {
    const pending = needsCoreAnalysisAfterRetake(
      { analysisStage: 'core', aiAttemptedAt: daysAgo(1), overallScore: 51 },
      { retakeAt: null },
    )
    assert.equal(pending, false)
  })
})

describe('buildRetakeHealthAnalysisReset', () => {
  it('drops live scores so a new core analysis is required', () => {
    const reset = buildRetakeHealthAnalysisReset('2026-08-26T17:00:55.168Z')
    assert.equal(reset.analysisStage, 'core')
    assert.equal(reset.retakePending, true)
    assert.equal(reset.resetAt, '2026-08-26T17:00:55.168Z')
    assert.equal(reset.overallScore, undefined)
    assert.equal(reset.scores, undefined)
    assert.equal(
      needsCoreAnalysisAfterRetake(reset, { retakeAt: '2026-08-26T17:00:55.168Z' }),
      true,
    )
  })
})

describe('resolveOptionalCompletedAtTimestamp', () => {
  it('keeps legacy detailed analysis time when there was no retake', () => {
    const analysis = detailedAnalysis(10)
    const resolved = resolveOptionalCompletedAtTimestamp({
      healthAnalysis: analysis,
    })
    assert.equal(resolved, analysis.aiAttemptedAt)
  })

  it('does not reuse old detailed timestamp after retake', () => {
    const analysis = detailedAnalysis(5)
    const nowIso = '2026-08-27T10:00:00.000Z'
    const resolved = resolveOptionalCompletedAtTimestamp({
      retakeAt: daysAgo(1),
      healthAnalysis: analysis,
      nowIso,
    })
    assert.equal(resolved, nowIso)
  })
})
