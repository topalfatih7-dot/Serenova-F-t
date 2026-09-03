import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatClock,
  formatLastActiveAt,
  formatRelativeTime,
  formatRelativeTimeWithClock,
  isDateOnlyStamp,
} from '../src/utils/relativeTime.js'

describe('relativeTime clock helpers', () => {
  it('does not invent a clock for date-only stamps', () => {
    assert.equal(isDateOnlyStamp('2026-09-03'), true)
    assert.equal(formatClock('2026-09-03'), null)
    assert.match(formatLastActiveAt('2026-09-03'), /2026/)
    assert.equal(formatLastActiveAt('2026-09-03').includes(':'), false)
  })

  it('appends HH:mm next to relative time', () => {
    const iso = new Date().toISOString()
    const clock = formatClock(iso)
    assert.match(clock, /^\d{2}:\d{2}$/)
    const withClock = formatRelativeTimeWithClock(iso)
    assert.ok(withClock.includes(clock))
    assert.ok(withClock.includes(formatRelativeTime(iso)))
  })
})
