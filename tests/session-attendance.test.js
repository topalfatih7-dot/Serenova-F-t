import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import {
  applyAttendanceEvent,
  closeOpenAttendanceSegments,
  computeBillableOverlapMinutes,
  computeOverlapMinutes,
  evaluateSessionBillable,
  isMeetingAttendanceClosed,
  normalizeAttendanceSide,
} from '../src/services/sessionAttendance.js'
import {
  buildDailyRoomName,
  decodeDailyUserId,
  encodeDailyUserId,
  parseDailyRoomName,
  verifyDailyWebhookSignature,
} from '../api/_daily.js'

const joinWindow = { before: 10, after: 20 }

function sessionAt(iso, duration = 30) {
  return { id: 's-1', date: iso, duration, status: 'scheduled' }
}

describe('session attendance segments', () => {
  it('does not count the gap between leave and rejoin', () => {
    let att = {}
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'member', 'leave', '2026-08-21T10:05:00.000Z')
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T10:20:00.000Z')
    att = applyAttendanceEvent(att, 'member', 'leave', '2026-08-21T10:40:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'leave', '2026-08-21T10:40:00.000Z')

    const session = sessionAt('2026-08-21T10:00:00.000Z', 60)
    const minutes = computeBillableOverlapMinutes(att, session, joinWindow)
    assert.equal(minutes, 25)
    assert.equal(isMeetingAttendanceClosed(att), true)
    assert.equal(evaluateSessionBillable(session, att, { joinWindow, finalized: true }).billable, true)
  })

  it('does not use now when leave is missing — open segments count as 0', () => {
    let att = {}
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'leave', '2026-08-21T10:20:00.000Z')
    const session = sessionAt('2026-08-21T10:00:00.000Z')
    assert.equal(computeBillableOverlapMinutes(att, session, joinWindow), 0)
    assert.equal(evaluateSessionBillable(session, att, { joinWindow }).ready, false)
  })

  it('closing a missing leave at window end only counts closed overlap', () => {
    let att = {}
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'leave', '2026-08-21T10:20:00.000Z')
    att = closeOpenAttendanceSegments(att, '2026-08-21T10:20:00.000Z')
    const session = sessionAt('2026-08-21T10:00:00.000Z')
    assert.equal(computeBillableOverlapMinutes(att, session, joinWindow), 20)
    const ev = evaluateSessionBillable(session, att, { joinWindow, finalized: true })
    assert.equal(ev.billable, true)
    assert.equal(ev.overlapMinutes, 20)
  })

  it('requires 15 minutes of simultaneous presence', () => {
    let att = {}
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'join', '2026-08-21T10:00:00.000Z')
    att = applyAttendanceEvent(att, 'member', 'leave', '2026-08-21T10:14:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'leave', '2026-08-21T10:14:00.000Z')
    const session = sessionAt('2026-08-21T10:00:00.000Z')
    const ev = evaluateSessionBillable(session, att, { joinWindow, finalized: true })
    assert.equal(ev.billable, false)
    assert.equal(ev.overlapMinutes, 14)
    assert.match(ev.reason, /14\/15/)
  })

  it('caps overlap at session duration', () => {
    let att = {}
    att = applyAttendanceEvent(att, 'member', 'join', '2026-08-21T09:50:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'join', '2026-08-21T09:50:00.000Z')
    att = applyAttendanceEvent(att, 'member', 'leave', '2026-08-21T11:00:00.000Z')
    att = applyAttendanceEvent(att, 'staff', 'leave', '2026-08-21T11:00:00.000Z')
    const session = sessionAt('2026-08-21T10:00:00.000Z', 30)
    assert.equal(computeBillableOverlapMinutes(att, session, joinWindow), 30)
  })

  it('clips Ahmet-style early join to the appointment window', () => {
    const att = {
      staff: {
        role: 'staff',
        joinedAt: '2026-08-21T07:49:53.848Z',
        leftAt: '2026-08-21T08:52:43.011Z',
      },
      member: {
        role: 'member',
        joinedAt: '2026-08-21T07:50:07.064Z',
        leftAt: '2026-08-21T08:52:31.383Z',
      },
    }
    const session = sessionAt('2026-08-21T08:51:00.000Z', 30)
    const minutes = computeBillableOverlapMinutes(att, session, joinWindow)
    assert.equal(minutes, 11)
    const ev = evaluateSessionBillable(session, att, { joinWindow, finalized: true })
    assert.equal(ev.billable, false)
    assert.equal(ev.overlapMinutes, 11)
  })

  it('normalizes legacy joinedAt/leftAt into a single segment', () => {
    const side = normalizeAttendanceSide({
      joinedAt: '2026-08-21T10:00:00.000Z',
      leftAt: '2026-08-21T10:20:00.000Z',
    })
    assert.equal(side.segments.length, 1)
    assert.equal(side.segments[0].in, '2026-08-21T10:00:00.000Z')
    assert.equal(computeOverlapMinutes(
      { joinedAt: '2026-08-21T10:00:00.000Z', leftAt: '2026-08-21T10:20:00.000Z' },
      { joinedAt: '2026-08-21T10:00:00.000Z', leftAt: '2026-08-21T10:20:00.000Z' },
    ), 20)
  })
})

describe('Daily room identity', () => {
  it('round-trips user ids and parses room names', () => {
    process.env.VITE_DAILY_ROOM_PREFIX = 'donusum'
    assert.equal(encodeDailyUserId('staff', 'abc'), 'staff:abc')
    assert.deepEqual(decodeDailyUserId('member:xyz'), { kind: 'member', id: 'xyz' })
    assert.equal(buildDailyRoomName('coach', 's-1787298538123-oueg'), 'donusum-coach-s-1787298538123-oueg')
    assert.deepEqual(parseDailyRoomName('donusum-coach-s-1787298538123-oueg'), {
      sessionType: 'coach',
      sessionId: 's-1787298538123-oueg',
    })
  })

  it('verifies Daily HMAC signatures and rejects stale timestamps', () => {
    const secret = crypto.randomBytes(32).toString('base64')
    const rawBody = '{"type":"participant.joined"}'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const signature = crypto
      .createHmac('sha256', Buffer.from(secret, 'base64'))
      .update(`${timestamp}.${rawBody}`)
      .digest('base64')
    assert.equal(verifyDailyWebhookSignature({ rawBody, signature, timestamp, secret }), true)
    assert.equal(verifyDailyWebhookSignature({
      rawBody,
      signature: 'nope',
      timestamp,
      secret,
    }), false)
    assert.equal(verifyDailyWebhookSignature({
      rawBody,
      signature,
      timestamp: String(Math.floor(Date.now() / 1000) - 600),
      secret,
    }), false)
  })
})
