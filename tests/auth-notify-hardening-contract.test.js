import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('auth/notification hardening contracts (2026-08-31)', () => {
  it('web collab realtime includes doctorId', () => {
    const src = read('src/hooks/useRealtimeSync.js')
    assert.ok(src.includes('thread.doctorId'))
  })

  it('application-notify has no cron role bypass', () => {
    const src = read('api/application-notify.js')
    assert.equal(src.includes("auth.role !== 'cron'"), false)
    assert.equal(src.includes("auth.role === 'cron'"), false)
    assert.ok(src.includes('canNotifyStaff'))
    assert.ok(src.includes('canNotifyMember'))
    assert.ok(src.includes('limit: 600'))
  })

  it('expo push selects silent android channel from soundNotifs', () => {
    const src = read('api/_expoPush.js')
    assert.ok(src.includes("ANDROID_CHANNEL_SILENT = 'yeniform-alerts-v3-silent'"))
    assert.ok(src.includes('soundNotifs'))
    assert.ok(src.includes("sound: soundOn ? 'default' : null"))
  })

  it('book/respond session use append_outbound_notification', () => {
    const book = read('api/_bookSession.js')
    const respond = read('api/_respondSession.js')
    assert.ok(book.includes("append_outbound_notification"))
    assert.ok(respond.includes("append_outbound_notification"))
    assert.equal(book.includes('staffData.notifications'), false)
  })

  it('github hourly reminders hit custom-domain task', () => {
    const yml = read('.github/workflows/session-reminders.yml')
    assert.ok(yml.includes('task=session-reminders'))
    assert.ok(yml.includes('www.yeniform.com'))
    assert.ok(yml.includes('CRON_SECRET'))
  })
})
