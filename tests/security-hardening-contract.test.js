import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('defensive hardening contracts (2026-09-13)', () => {
  it('stripe checkout does not reflect Origin or allow any CORS origin', () => {
    const src = read('api/stripe-checkout.js')
    assert.equal(src.includes("Access-Control-Allow-Origin', '*'"), false)
    assert.ok(src.includes('setCorsHeaders'))
    assert.ok(src.includes('checkoutReturnOrigin'))
    assert.ok(src.includes('checkoutEmailFromAuth'))
    assert.equal(src.includes('normalizeEmailAddress(body.email)'), false)
  })

  it('stripe webhook bypass is off in production', () => {
    const src = read('api/stripe-webhook.js')
    assert.ok(src.includes("process.env.VERCEL === '1'"))
    assert.ok(src.includes('STRIPE_WEBHOOK_DEV_BYPASS'))
  })

  it('daily webhook verifies signature before handling test payloads', () => {
    const src = read('api/daily-room.js')
    const sig = src.indexOf('verifyDailyWebhookSignature')
    const test = src.indexOf('payload?.test')
    assert.ok(sig > 0 && test > sig)
  })

  it('telegram ops notify ignores client-supplied message bodies', () => {
    const src = read('api/telegram-notify.js')
    assert.equal(src.includes('body.message'), false)
    assert.ok(src.includes('buildOpsNotifyText'))
    assert.ok(src.includes("error: 'Bildirim gönderilemedi'"))
  })

  it('exercise video API checks access before signing', () => {
    const src = read('api/auth.js')
    assert.ok(src.includes('assertExerciseVideoAccess'))
    assert.equal(src.includes("user.user_metadata?.role"), false)
  })

  it('staff application docs upload returns a signed URL not a public URL', () => {
    const src = read('api/contact.js')
    assert.equal(src.includes('getPublicUrl(path)'), false)
    assert.ok(src.includes('createSignedUrl'))
    assert.ok(src.includes('randomUUID'))
  })

  it('chat insert binds sender to the authenticated user', () => {
    const chat = read('src/services/chatDb.js')
    assert.ok(chat.includes('Gönderen bilgisi oturumla uyuşmuyor'))
    const sql = read('supabase/migrations/20260913_defensive_hardening.sql')
    assert.ok(sql.includes("sender_type = 'member'"))
    assert.ok(sql.includes('t.staff_id = (select auth.uid())'))
    assert.ok(sql.includes('fullLibraryAccess'))
    assert.ok(sql.includes("set public = false"))
    assert.ok(sql.includes('can_access_exercise_video'))
  })

  it('site-wide clickjacking headers cover HTML routes', () => {
    const src = read('vercel.json')
    assert.ok(src.includes('"source": "/(.*)"'))
    assert.ok(src.includes('X-Frame-Options'))
  })
})
