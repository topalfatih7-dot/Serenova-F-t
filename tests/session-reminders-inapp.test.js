/**
 * In-app randevu hatırlatması — WhatsApp kaldırıldıktan sonra T-24s hâlâ listeye yazılır.
 */
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { runSessionRemindersBatch } from '../api/_sessionReminders.js'

function createAdminMock(store) {
  const memberPages = { n: 0 }
  return {
    rpc: async (name, params) => {
      if (name === 'append_outbound_notification' && params?.p_audience === 'staff' && store.staffRow) {
        const prev = Array.isArray(store.staffRow.data?.notifications)
          ? store.staffRow.data.notifications
          : []
        store.staffRow.data = {
          ...(store.staffRow.data || {}),
          notifications: [params.p_notification, ...prev],
        }
      }
      return { data: null, error: null }
    },
    from(table) {
      const ctx = { table, payload: null }
      const builder = {
        select() {
          return builder
        },
        eq() {
          return builder
        },
        neq() {
          return builder
        },
        or() {
          return builder
        },
        order() {
          return builder
        },
        range() {
          return builder
        },
        limit() {
          return builder
        },
        maybeSingle: async () => {
          if (ctx.table === 'members') return { data: store.memberRow }
          if (ctx.table === 'staff') return { data: store.staffRow }
          return { data: null }
        },
        update(payload) {
          ctx.payload = payload
          return {
            eq: async () => {
              if (ctx.table === 'members' && payload.data) {
                store.memberRow.data = payload.data
              }
              if (ctx.table === 'staff' && payload.data) {
                store.staffRow.data = payload.data
              }
              return { error: null }
            },
          }
        },
        then(resolve, reject) {
          if (ctx.table === 'members') {
            memberPages.n += 1
            const data = memberPages.n === 1 ? [store.memberRow] : []
            return Promise.resolve({ data, error: null }).then(resolve, reject)
          }
          return Promise.resolve({ data: [], error: null }).then(resolve, reject)
        },
      }
      return builder
    },
  }
}

describe('session reminders in-app (no WhatsApp)', () => {
  it('writes member + staff appointment notifications at T-24h and marks waReminders.t24', async () => {
    const now = new Date('2026-08-30T12:00:00.000+03:00')
    const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const store = {
      memberRow: {
        id: 'member-1',
        name: 'Ayşe',
        assigned_coach_id: 'staff-1',
        assigned_dietitian_id: null,
        data: {
          coachSessions: [
            {
              id: 'bk-1',
              status: 'scheduled',
              date: startsAt.toISOString(),
            },
          ],
          notifications: [],
        },
      },
      staffRow: {
        id: 'staff-1',
        data: { notifications: [] },
      },
    }
    const admin = createAdminMock(store)
    const result = await runSessionRemindersBatch(admin, { now })

    assert.equal(result.ok, true)
    assert.equal(result.marked, 1)
    assert.equal(result.sent, 1)
    assert.equal(result.errors.length, 0)

    const memberNotes = store.memberRow.data.notifications
    assert.equal(memberNotes.length, 1)
    assert.equal(memberNotes[0].type, 'appointment')
    assert.equal(memberNotes[0].title, 'Randevunuz yarın')
    assert.equal(memberNotes[0].sessionId, 'bk-1')

    const staffNotes = store.staffRow.data.notifications
    assert.equal(staffNotes.length, 1)
    assert.equal(staffNotes[0].type, 'appointment')
    assert.equal(staffNotes[0].title, 'Görüşme yarın')
    assert.match(staffNotes[0].message, /Ayşe/)

    const session = store.memberRow.data.coachSessions[0]
    assert.ok(session.waReminders.t24)
    assert.equal(session.waReminders.t1, undefined)
  })

  it('does not mark waReminders when Expo push fails', async () => {
    const now = new Date('2026-08-30T12:00:00.000+03:00')
    const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const store = {
      memberRow: {
        id: 'member-1',
        name: 'Ayşe',
        assigned_coach_id: 'staff-1',
        data: {
          coachSessions: [{ id: 'bk-1', status: 'scheduled', date: startsAt.toISOString() }],
          notifications: [],
        },
      },
      staffRow: { id: 'staff-1', data: { notifications: [] } },
    }
    const failPush = async () => ({ ok: false, error: 'Expo down' })
    const result = await runSessionRemindersBatch(createAdminMock(store), {
      now,
      pushMember: failPush,
      pushStaff: failPush,
    })
    assert.equal(result.ok, false)
    assert.equal(result.marked, 0)
    assert.equal(result.sent, 0)
    assert.ok(result.errors.length >= 1)
    assert.equal(store.memberRow.data.notifications.length, 0)
    assert.equal(store.memberRow.data.coachSessions[0].waReminders, undefined)
  })

  it('skips a window already marked in waReminders', async () => {
    const now = new Date('2026-08-30T12:00:00.000+03:00')
    const startsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const store = {
      memberRow: {
        id: 'member-1',
        name: 'Ayşe',
        assigned_coach_id: 'staff-1',
        data: {
          coachSessions: [
            {
              id: 'bk-1',
              status: 'scheduled',
              date: startsAt.toISOString(),
              waReminders: { t24: '2026-08-29T12:00:00.000Z' },
            },
          ],
          notifications: [],
        },
      },
      staffRow: { id: 'staff-1', data: { notifications: [] } },
    }
    const result = await runSessionRemindersBatch(createAdminMock(store), { now })
    assert.equal(result.marked, 0)
    assert.equal(store.memberRow.data.notifications.length, 0)
    assert.equal(store.staffRow.data.notifications.length, 0)
  })
})
