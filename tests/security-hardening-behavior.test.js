import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { checkoutEmailFromAuth } from '../api/_checkoutSecurity.js'
import { programGrantsFullLibrary, programIncludesExerciseId, isExerciseVideoStoragePath } from '../api/_exerciseVideoAccess.js'
import { buildOpsNotifyText, ALLOWED_OPS_EVENTS } from '../api/telegram-notify.js'
import { isSafeStaffDocPath, staffDocStoragePath } from '../src/utils/staffApplicationDocs.js'
import { isSafeAttachmentDownloadUrl } from '../api/_mailbox.js'

describe('checkoutEmailFromAuth', () => {
  it('prefers the member row email over user metadata', () => {
    assert.equal(
      checkoutEmailFromAuth(
        { email: 'auth@yeniform.com', user_metadata: { email: 'meta@evil.test' } },
        { email: 'member@yeniform.com' },
      ),
      'member@yeniform.com',
    )
  })

  it('does not read an untrusted extra field', () => {
    const user = { email: 'real@yeniform.com', user_metadata: { email: 'meta@yeniform.com' } }
    assert.equal(checkoutEmailFromAuth(user, null), 'real@yeniform.com')
  })
})

describe('exercise video access helpers', () => {
  it('rejects traversal-like paths', () => {
    assert.equal(isExerciseVideoStoragePath('gym100-0001.mp4'), true)
    assert.equal(isExerciseVideoStoragePath('../secret.mp4'), false)
    assert.equal(isExerciseVideoStoragePath('a/b.mp4'), false)
    assert.equal(isExerciseVideoStoragePath(''), false)
  })

  it('grants full library only via catalog flag', () => {
    assert.equal(programGrantsFullLibrary({ source: 'library_catalog' }), true)
    assert.equal(programGrantsFullLibrary({ fullLibraryAccess: true }), true)
    assert.equal(programGrantsFullLibrary({ entries: [{ exerciseId: 'x' }] }), false)
  })

  it('scopes program entries to matching exercise ids', () => {
    const data = { entries: [{ exerciseId: '11111111-1111-1111-1111-111111111111', exerciseName: 'Squat' }] }
    assert.equal(programIncludesExerciseId(data, '11111111-1111-1111-1111-111111111111'), true)
    assert.equal(programIncludesExerciseId(data, '22222222-2222-2222-2222-222222222222'), false)
  })
})

describe('ops telegram text', () => {
  it('only allows known events and uses the authenticated identity', () => {
    assert.equal(ALLOWED_OPS_EVENTS.has('member_login'), true)
    assert.equal(ALLOWED_OPS_EVENTS.has('custom'), false)
    const text = buildOpsNotifyText('member_login', {
      email: 'uye@yeniform.com',
      user_metadata: { name: 'Ayşe <script>' },
    })
    assert.equal(text.includes('uye@yeniform.com'), true)
    assert.equal(text.includes('<script>'), false)
    assert.equal(text.includes('&lt;script&gt;'), true)
  })
})

describe('staff application document paths', () => {
  it('accepts storage object names and public URL tails', () => {
    assert.equal(isSafeStaffDocPath('ok.pdf'), true)
    assert.equal(isSafeStaffDocPath('../x.pdf'), false)
    const fromPublic = staffDocStoragePath('https://example.supabase.co/storage/v1/object/public/staff-application-docs/abc.pdf')
    assert.equal(fromPublic, 'abc.pdf')
    const fromObj = staffDocStoragePath({ path: 'uuid-file.webp', url: 'https://expired.example/x' })
    assert.equal(fromObj, 'uuid-file.webp')
  })
})

describe('mailbox attachment download URL guard', () => {
  it('rejects non-https and private hosts', () => {
    assert.equal(isSafeAttachmentDownloadUrl('https://files.resend.com/a.bin'), true)
    assert.equal(isSafeAttachmentDownloadUrl('http://files.resend.com/a.bin'), false)
    assert.equal(isSafeAttachmentDownloadUrl('https://127.0.0.1/secret'), false)
    assert.equal(isSafeAttachmentDownloadUrl('https://169.254.169.254/latest/meta-data'), false)
    assert.equal(isSafeAttachmentDownloadUrl('https://10.0.0.5/internal'), false)
  })
})
