import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import {
  extractEmailAddress,
  extractDisplayName,
  normalizeSubject,
  pickAliasEmail,
  snippetFromBodies,
  uniqueEmails,
  attachmentExtOk,
} from '../api/_mailboxUtil.js'
import { verifyResendWebhook, isResendWebhookRequest } from '../api/_resendWebhook.js'
import { buildResendSendBody, mailboxPersonalEmail } from '../api/_mailer.js'

describe('mailbox util', () => {
  it('extracts email and display name', () => {
    assert.equal(extractEmailAddress('Yeni Form <info@yeniform.com>'), 'info@yeniform.com')
    assert.equal(extractDisplayName('Yeni Form <info@yeniform.com>'), 'Yeni Form')
    assert.equal(extractEmailAddress('DESTEK@YENIFORM.COM'), 'destek@yeniform.com')
  })

  it('normalizes reply subjects', () => {
    assert.equal(normalizeSubject('Re: Re: Talebiniz'), 'talebiniz')
    assert.equal(normalizeSubject('Fwd:  Hello'), 'hello')
  })

  it('picks allowlisted alias from recipients', () => {
    const aliases = [{ email: 'info@yeniform.com', is_active: true }]
    assert.equal(
      pickAliasEmail(['ops@hotmail.com', 'info@yeniform.com'], aliases),
      'info@yeniform.com',
    )
    assert.equal(pickAliasEmail(['random@yeniform.com'], aliases), '')
  })

  it('builds snippet and unique emails', () => {
    assert.equal(snippetFromBodies({ text: 'Merhaba dünya' }), 'Merhaba dünya')
    assert.deepEqual(uniqueEmails(['A@X.com', 'a@x.com', 'b@x.com']), ['a@x.com', 'b@x.com'])
    assert.equal(attachmentExtOk('sozlesme.pdf'), true)
    assert.equal(attachmentExtOk('virus.exe'), false)
  })
})

describe('resend webhook verify', () => {
  it('accepts a valid svix signature', () => {
    const secretBytes = Buffer.from('test-secret-bytes')
    const secret = `whsec_${secretBytes.toString('base64')}`
    const id = 'msg_123'
    const timestamp = String(Math.floor(Date.now() / 1000))
    const payload = '{"type":"email.received","data":{"email_id":"abc"}}'
    const signature = createHmac('sha256', secretBytes)
      .update(`${id}.${timestamp}.${payload}`)
      .digest('base64')
    const result = verifyResendWebhook({
      payload,
      headers: {
        'svix-id': id,
        'svix-timestamp': timestamp,
        'svix-signature': `v1,${signature}`,
      },
      secret,
    })
    assert.equal(result.ok, true)
    assert.equal(result.event.type, 'email.received')
  })

  it('rejects a bad signature', () => {
    const result = verifyResendWebhook({
      payload: '{}',
      headers: {
        'svix-id': 'msg',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,AAAA',
      },
      secret: `whsec_${Buffer.from('abc').toString('base64')}`,
    })
    assert.equal(result.ok, false)
  })

  it('detects webhook requests', () => {
    assert.equal(isResendWebhookRequest({ headers: { 'svix-id': '1' } }), true)
    assert.equal(isResendWebhookRequest({ headers: {} }), false)
  })
})

describe('mailbox send payload', () => {
  it('includes from, headers and attachments', () => {
    const { body, recipients } = buildResendSendBody({
      from: 'Yeni Form <info@yeniform.com>',
      to: 'ops25123@hotmail.com',
      subject: 'Test',
      html: '<p>Merhaba</p>',
      text: 'Merhaba',
      headers: { 'In-Reply-To': '<id@mail>' },
      attachments: [{ filename: 'a.pdf', content: 'AAAA', contentType: 'application/pdf' }],
    })
    assert.deepEqual(recipients, ['ops25123@hotmail.com'])
    assert.equal(body.from, 'Yeni Form <info@yeniform.com>')
    assert.equal(body.headers['In-Reply-To'], '<id@mail>')
    assert.equal(body.attachments[0].filename, 'a.pdf')
  })

  it('escapes mailbox body html', () => {
    const mail = mailboxPersonalEmail({
      body: '<script>alert(1)</script>\nSatır 2',
      signature: 'Yeni Form',
    })
    assert.equal(mail.html.includes('<script>'), false)
    assert.equal(mail.html.includes('&lt;script&gt;'), true)
    assert.equal(mail.html.includes('<br />Satır 2'), true)
  })
})
