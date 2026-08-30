import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function read(rel) {
  return readFileSync(join(root, rel), 'utf8')
}

describe('WhatsApp removal contracts', () => {
  it('application-notify no longer imports Meta WhatsApp modules', () => {
    const src = read('api/application-notify.js')
    assert.equal(src.includes('_whatsapp'), false)
    assert.equal(src.includes('sendWhatsApp'), false)
    assert.ok(src.includes('sendExpoPushToMember'))
    assert.ok(src.includes('sendExpoPushToStaff'))
    assert.ok(src.includes("body.action === 'whatsapp-event'"))
    assert.ok(src.includes('410'))
  })

  it('memberNotifications no longer exposes notifyWhatsAppEvent', () => {
    const src = read('src/services/memberNotifications.js')
    assert.equal(src.includes('notifyWhatsAppEvent'), false)
    assert.ok(src.includes('dispatchOutbound'))
    assert.ok(src.includes('/api/application-notify'))
    assert.ok(src.includes('notifyMemberChatMessage'))
    assert.ok(src.includes('notifyMemberProgram'))
  })

  it('chat still notifies in-app + Expo, not WhatsApp', () => {
    const src = read('src/services/chatDb.js')
    assert.equal(src.includes('notifyWhatsAppEvent'), false)
    assert.ok(src.includes('notifyMemberChatMessage'))
    assert.ok(src.includes('notifyStaffChatMessage'))
  })

  it('session reminders module does not send WhatsApp templates', () => {
    const src = read('api/_sessionReminders.js')
    assert.equal(src.includes('sendWhatsAppTemplate'), false)
    assert.equal(src.includes('_whatsapp'), false)
    assert.ok(src.includes('runSessionRemindersBatch'))
    assert.ok(src.includes("title = windowKey === 't1' ? 'Randevunuz 1 saat sonra' : 'Randevunuz yarın'"))
  })

  it('public web copy and member settings have no WhatsApp product', () => {
    const landing = read('src/pages/services/ServiceLandingPage.jsx')
    const seo = read('src/data/seoServiceContent.js')
    const staffProfile = read('src/components/staff/StaffProfileEditor.jsx')
    const memberProfile = read('src/pages/ProfilePage.jsx')
    for (const src of [landing, seo, staffProfile, memberProfile]) {
      assert.match(src, /./)
      assert.equal(/whatsapp/i.test(src), false)
    }
  })
})
