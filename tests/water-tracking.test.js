import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_WATER_GOAL_ML,
  clampAmountMl,
  clampGoalMl,
  fillPercent,
  goalReached,
  isGoalCustomized,
  lastLogForDate,
  remainingMl,
  resolveDailyGoalMl,
  sumMlForDate,
} from '../src/utils/waterTracking.js'

describe('waterTracking', () => {
  it('defaults missing goal to 2000 ml', () => {
    assert.equal(resolveDailyGoalMl(undefined), DEFAULT_WATER_GOAL_ML)
    assert.equal(resolveDailyGoalMl({}), DEFAULT_WATER_GOAL_ML)
    assert.equal(resolveDailyGoalMl({ dailyGoalMl: 1800 }), 1800)
  })

  it('rejects non-ml glass math and clamps amounts', () => {
    assert.equal(clampAmountMl(200), 200)
    assert.equal(clampAmountMl(0), null)
    assert.equal(clampAmountMl(1001), null)
    assert.equal(clampGoalMl(2000), 2000)
    assert.equal(clampGoalMl(400), null)
    assert.equal(clampGoalMl(6000), null)
  })

  it('sums and undoes by local date', () => {
    const logs = [
      { id: 'a', localDate: '2026-08-25', amountMl: 200, loggedAt: '2026-08-25T08:00:00Z' },
      { id: 'b', localDate: '2026-08-25', amountMl: 300, loggedAt: '2026-08-25T10:00:00Z' },
      { id: 'c', localDate: '2026-08-24', amountMl: 500, loggedAt: '2026-08-24T10:00:00Z' },
    ]
    assert.equal(sumMlForDate(logs, '2026-08-25'), 500)
    assert.equal(lastLogForDate(logs, '2026-08-25').id, 'b')
  })

  it('treats goal as reached at 100 percent without glass conversion', () => {
    assert.equal(fillPercent(2000, 2000), 100)
    assert.equal(fillPercent(2500, 2000), 100)
    assert.equal(goalReached(2000, 2000), true)
    assert.equal(remainingMl(650, 2000), 1350)
    assert.equal(isGoalCustomized({ goalUpdatedBy: { id: 'x' } }), true)
    assert.equal(isGoalCustomized({}), false)
  })
})
