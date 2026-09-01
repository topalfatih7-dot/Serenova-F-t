import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('expo receipts + batch push contracts', () => {
  it('records tickets and polls getReceipts', () => {
    const push = read('api/_expoPush.js')
    assert.ok(push.includes('recordPushTickets'))
    assert.ok(push.includes('sendExpoPushBatch'))
    assert.ok(push.includes('EXPO_BATCH_SIZE = 100'))
    assert.ok(push.includes("audience === 'staff') console.warn('[expoPush] skip'"))
    assert.ok(push.includes('notification.sessionType'))
    assert.ok(push.includes('collapseId'))

    const receipts = read('api/_expoReceipts.js')
    assert.ok(receipts.includes('runPushReceiptsBatch'))
    assert.ok(receipts.includes('getReceipts'))
    assert.ok(receipts.includes('DeviceNotRegistered'))
    assert.ok(receipts.includes('InvalidCredentials'))
    assert.ok(receipts.includes('sendTelegramMessage'))

    const cron = read('api/ai-blog-generate.js')
    assert.ok(cron.includes('task === \'push-receipts\''))
    assert.ok(cron.includes('runPushReceiptsBatch'))
  })

  it('admin broadcast batches Expo and raises recipient cap', () => {
    const src = read('api/_adminBroadcast.js')
    assert.ok(src.includes('MAX_RECIPIENTS = 200'))
    assert.ok(src.includes('sendExpoPushBatch'))
    assert.ok(src.includes('emailFallback'))
    assert.ok(src.includes('staffWithoutToken'))

    const page = read('src/pages/admin/AdminBroadcastPage.jsx')
    assert.ok(page.includes('CART_MAX = 200'))
    assert.ok(page.includes('Cihaz yok'))
  })

  it('session reminders fail closed and paginate non-free members', () => {
    const src = read('api/_sessionReminders.js')
    assert.ok(src.includes('ok: errors.length === 0'))
    assert.ok(src.includes('membership.is.null,membership.neq.free'))
    assert.ok(src.includes('PAGE_SIZE = 200'))
    assert.ok(src.includes('markSessionWindow'))
  })
})
