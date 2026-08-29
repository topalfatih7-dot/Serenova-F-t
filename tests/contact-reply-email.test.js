import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { contactReplyEmail } from '../api/_mailer.js'
import { parseContactReplies, contactSubjectLabel } from '../src/utils/contactInquiry.js'

describe('contactInquiry helpers', () => {
  it('maps known subjects and falls back', () => {
    assert.equal(contactSubjectLabel('membership'), 'Üyelik & kayıt')
    assert.equal(contactSubjectLabel('unknown'), 'unknown')
    assert.equal(contactSubjectLabel(''), 'Genel bilgi')
  })

  it('parses reply payloads and drops empty rows', () => {
    const parsed = parseContactReplies([
      { id: '1', body: 'Merhaba', sentAt: '2026-08-29T10:00:00Z', sentByName: 'Admin' },
      { text: 'Eski alan', sent_at: '2026-08-29T11:00:00Z' },
      { body: '   ' },
      null,
    ])
    assert.equal(parsed.length, 2)
    assert.equal(parsed[0].body, 'Merhaba')
    assert.equal(parsed[1].body, 'Eski alan')
    assert.equal(parseContactReplies(null).length, 0)
  })
})

describe('contactReplyEmail', () => {
  it('escapes HTML in name, reply and original message', () => {
    const mail = contactReplyEmail({
      name: '<script>alert(1)</script>',
      replyBody: '<img src=x onerror=alert(1)>',
      originalMessage: '<b>eski</b>',
      originalSubject: 'support',
      originalDateLabel: '29 Ağu 2026',
    })
    assert.match(mail.subject, /Teknik destek/)
    assert.equal(mail.html.includes('<script>'), false)
    assert.equal(mail.html.includes('<img src=x'), false)
    assert.equal(mail.html.includes('<b>eski</b>'), false)
    assert.equal(mail.html.includes('&lt;script&gt;'), true)
    assert.equal(mail.html.includes('&lt;img src=x'), true)
    assert.equal(mail.html.includes('&lt;b&gt;eski&lt;/b&gt;'), true)
    assert.equal(mail.text.includes('<script>'), true)
  })

  it('converts newlines in the reply body', () => {
    const mail = contactReplyEmail({
      name: 'Ayşe',
      replyBody: 'Satır 1\nSatır 2',
      originalMessage: 'Merhaba',
      originalSubject: 'general',
    })
    assert.equal(mail.html.includes('Satır 1<br />Satır 2'), true)
    assert.equal(mail.text.includes('Satır 1\nSatır 2'), true)
  })
})
