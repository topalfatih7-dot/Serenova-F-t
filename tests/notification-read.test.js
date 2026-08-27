import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  mergeNotificationLists,
  markNotificationsReadInList,
  relatedChatNotificationIds,
  isViewingChatNotification,
  chatAlertDedupeKey,
} from '../src/utils/notificationRead.js'

describe('notificationRead', () => {
  it('keeps local read flags when the remote copy is still unread', () => {
    const local = [
      { id: 'a', read: true, title: 'A' },
      { id: 'b', read: false, title: 'B' },
    ]
    const incoming = [
      { id: 'a', read: false, title: 'A' },
      { id: 'b', read: false, title: 'B' },
      { id: 'c', read: false, title: 'C' },
    ]
    const merged = mergeNotificationLists(incoming, local)
    assert.equal(merged.find((n) => n.id === 'a').read, true)
    assert.equal(merged.find((n) => n.id === 'b').read, false)
    assert.equal(merged.find((n) => n.id === 'c').read, false)
  })

  it('marks selected or all notifications read', () => {
    const list = [
      { id: 'a', read: false },
      { id: 'b', read: false },
      { id: 'c', read: true },
    ]
    const one = markNotificationsReadInList(list, { ids: ['b'] })
    assert.equal(one.find((n) => n.id === 'a').read, false)
    assert.equal(one.find((n) => n.id === 'b').read, true)
    const all = markNotificationsReadInList(list, { all: true })
    assert.ok(all.every((n) => n.read))
  })

  it('finds unread chat notifications for an open thread', () => {
    const list = [
      { id: '1', type: 'chat', read: false, threadId: 't1', staffRole: 'coach' },
      { id: '2', type: 'chat', read: false, staffRole: 'coach' },
      { id: '3', type: 'chat', read: false, staffRole: 'dietitian' },
      { id: '4', type: 'program', read: false, staffRole: 'coach' },
      { id: '5', type: 'chat', read: true, threadId: 't1' },
      { id: '6', type: 'chat', read: false, memberId: 'm1', threadId: 't9' },
    ]
    const ids = relatedChatNotificationIds(list, { threadId: 't1', staffRole: 'coach' })
    assert.deepEqual(ids.sort(), ['1', '2'])
    const staffIds = relatedChatNotificationIds(list, { memberId: 'm1' })
    assert.deepEqual(staffIds, ['6'])
  })

  it('suppresses chat alerts only on the matching open thread', () => {
    const memberNotif = { type: 'chat', staffRole: 'coach', threadId: 't1' }
    const staffNotif = { type: 'chat', memberId: 'm1', threadId: 't1' }
    assert.equal(isViewingChatNotification(memberNotif, '/messages/coach'), true)
    assert.equal(isViewingChatNotification(memberNotif, '/messages/dietitian'), false)
    assert.equal(isViewingChatNotification(memberNotif, '/staff/messages/m1'), false)
    assert.equal(isViewingChatNotification(staffNotif, '/staff/messages/m1'), true)
    assert.equal(isViewingChatNotification(staffNotif, '/staff/messages/other'), false)
    assert.equal(isViewingChatNotification(staffNotif, '/staff'), false)
    assert.equal(isViewingChatNotification({ type: 'program' }, '/messages/coach'), false)
  })

  it('dedupes chat alerts by thread or member', () => {
    assert.equal(chatAlertDedupeKey({ type: 'chat', threadId: 't1', id: 'a' }), 't1')
    assert.equal(chatAlertDedupeKey({ type: 'chat', memberId: 'm1', id: 'b' }), 'm1')
    assert.equal(chatAlertDedupeKey({ type: 'program', id: 'c' }), 'c')
  })
})
