import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  formatStaffPayoutPeriodLabel,
  formatStaffPayoutWindowLabel,
  staffPayoutAccrualWindow,
  staffPayoutPeriodKey,
  ymdKey,
} from '../src/data/staffPayouts.js'

describe('staff payout period (Istanbul, Friday–Thursday → next Friday)', () => {
  it('sends Thursday 23:59 Istanbul to the next calendar Friday', () => {
    // 3 Eyl 2026 Perşembe 23:59 TRT = 20:59 UTC
    assert.equal(staffPayoutPeriodKey('2026-09-03T20:59:00.000Z'), '2026-09-04')
  })

  it('sends Friday 00:00 Istanbul to the following Friday, not the same day', () => {
    // 4 Eyl 2026 Cuma 00:00 TRT = 3 Eyl 21:00 UTC
    assert.equal(staffPayoutPeriodKey('2026-09-03T21:00:00.000Z'), '2026-09-11')
  })

  it('uses session start when the call crosses midnight', () => {
    const startThursday = '2026-09-03T20:50:00.000Z' // 23:50 TRT Perşembe
    assert.equal(staffPayoutPeriodKey(startThursday), '2026-09-04')
  })

  it('maps Saturday through Wednesday onto the coming Friday', () => {
    assert.equal(staffPayoutPeriodKey('2026-08-29T07:00:00.000Z'), '2026-09-04') // Cmt
    assert.equal(staffPayoutPeriodKey('2026-08-31T07:00:00.000Z'), '2026-09-04') // Pzt
    assert.equal(staffPayoutPeriodKey('2026-09-02T07:00:00.000Z'), '2026-09-04') // Çar
  })

  it('describes the accrual window as previous Friday through Thursday', () => {
    const window = staffPayoutAccrualWindow('2026-09-04')
    assert.deepEqual(ymdKey(window.start), '2026-08-28')
    assert.deepEqual(ymdKey(window.end), '2026-09-03')
    assert.match(formatStaffPayoutWindowLabel('2026-09-04'), /28.*3/)
    assert.match(formatStaffPayoutPeriodLabel('2026-09-04'), /4/)
  })

  it('keeps legacy ISO week labels readable', () => {
    assert.equal(formatStaffPayoutPeriodLabel('2026-W35'), '2026 · Hafta 35')
  })
})
