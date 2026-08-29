import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  collectHealthLabFiles,
  isHealthLabImage,
  isHealthLabStoragePath,
  patchHealthTestLabFiles,
} from '../src/utils/healthLabFiles.js'
import { describeHealthTest } from '../src/data/healthTest.js'
import { isPanelChatPath, isPanelChatThreadPath } from '../src/utils/chatLayout.js'

const MEMBER_ID = 'b4141933-6cf1-4296-987f-fca5b5790fb9'

describe('healthLabFiles', () => {
  it('accepts member-scoped storage paths', () => {
    assert.equal(isHealthLabStoragePath(`${MEMBER_ID}/123-abc.pdf`, MEMBER_ID), true)
    assert.equal(isHealthLabStoragePath(`${MEMBER_ID}/../secret.pdf`, MEMBER_ID), false)
    assert.equal(isHealthLabStoragePath('other-id/123-abc.pdf', MEMBER_ID), false)
    assert.equal(isHealthLabStoragePath('/abs/file.pdf', MEMBER_ID), false)
  })

  it('collects only valid bloodWorkFiles entries', () => {
    const files = collectHealthLabFiles({
      bloodWorkFiles: [
        { path: `${MEMBER_ID}/1.png`, name: 'tahlil.png', contentType: 'image/png' },
        { path: 'evil/../x.pdf', name: 'bad' },
        { path: `${MEMBER_ID}/2.pdf`, name: 'rapor.pdf', contentType: 'application/pdf' },
        null,
      ],
    }, MEMBER_ID)
    assert.equal(files.length, 2)
    assert.equal(files[0].name, 'tahlil.png')
    assert.equal(isHealthLabImage(files[0]), true)
    assert.equal(isHealthLabImage(files[1]), false)
  })

  it('marks upload intent when files are added', () => {
    const next = patchHealthTestLabFiles(
      { lastBloodWork: 'last_3_months', bloodWorkUploadIntent: 'later' },
      [{ path: `${MEMBER_ID}/1.pdf`, name: 'a.pdf' }],
    )
    assert.equal(next.bloodWorkUploadIntent, 'yes')
    assert.equal(next.lastBloodWork, 'last_3_months')
    assert.equal(next.bloodWorkFiles.length, 1)
  })
})

describe('describeHealthTest nested lab follow-ups', () => {
  it('includes nested upload intent and skips file rows', () => {
    const sections = describeHealthTest({
      lastBloodWork: 'last_3_months',
      bloodWorkUploadIntent: 'yes',
      bloodWorkFiles: [
        { path: `${MEMBER_ID}/1.pdf`, name: 'hemogram.pdf', contentType: 'application/pdf' },
      ],
    }, 'male')
    const medical = sections.find((s) => s.id === 'medical')
    assert.ok(medical)
    const labels = medical.items.map((it) => it.label)
    assert.equal(labels.some((l) => l.includes('Son kan tahlilinizi')), true)
    assert.equal(labels.some((l) => l.includes('yüklemek ister misiniz')), true)
    assert.equal(labels.some((l) => l.includes('Kan tahlili sonuçlarınızı yükleyin')), false)
    const intent = medical.items.find((it) => it.label.includes('yüklemek ister misiniz'))
    assert.equal(intent.value, 'Evet')
  })
})

describe('chatLayout paths', () => {
  it('detects member and staff chat routes', () => {
    assert.equal(isPanelChatPath('/messages'), true)
    assert.equal(isPanelChatPath('/messages/coach'), true)
    assert.equal(isPanelChatPath('/staff/messages/abc'), true)
    assert.equal(isPanelChatPath('/staff/admin-messages'), true)
    assert.equal(isPanelChatPath('/admin/messages/audit/t1'), true)
    assert.equal(isPanelChatPath('/dashboard'), false)
  })

  it('treats open threads as full-bleed mobile chat', () => {
    assert.equal(isPanelChatThreadPath('/messages'), false)
    assert.equal(isPanelChatThreadPath('/messages/coach'), true)
    assert.equal(isPanelChatThreadPath('/staff/messages'), false)
    assert.equal(isPanelChatThreadPath('/staff/messages/m1'), true)
    assert.equal(isPanelChatThreadPath('/staff/admin-messages'), true)
    assert.equal(isPanelChatThreadPath('/admin/messages'), false)
    assert.equal(isPanelChatThreadPath('/admin/messages/staff/s1'), true)
  })
})
