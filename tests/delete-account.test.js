import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CANCELABLE_SUB_STATUSES, emailsMatch, userHasPasswordProvider } from '../api/_deleteAccount.js'
import { parseMobileHandoffNext } from '../src/utils/authRedirect.js'

describe('delete-account helpers', () => {
  it('matches emails case-insensitively', () => {
    assert.equal(emailsMatch('A@Yeniform.com', 'a@yeniform.com'), true)
    assert.equal(emailsMatch('a@x.com', 'b@x.com'), false)
  })

  it('treats email provider and empty identities as password accounts', () => {
    assert.equal(userHasPasswordProvider({ app_metadata: { providers: ['email'] } }), true)
    assert.equal(userHasPasswordProvider({ identities: [{ provider: 'email' }] }), true)
    assert.equal(userHasPasswordProvider({}), true)
    assert.equal(userHasPasswordProvider({ identities: [{ provider: 'google' }] }), false)
  })

  it('only cancels live-ish subscription statuses', () => {
    assert.equal(CANCELABLE_SUB_STATUSES.has('active'), true)
    assert.equal(CANCELABLE_SUB_STATUSES.has('canceled'), false)
    assert.equal(CANCELABLE_SUB_STATUSES.has('incomplete_expired'), false)
  })
})

describe('mobile handoff next', () => {
  it('allows plans and account deletion paths', () => {
    assert.equal(parseMobileHandoffNext('/plans'), '/plans')
    assert.equal(parseMobileHandoffNext('/plans?plan=vip'), '/plans?plan=vip')
    assert.equal(parseMobileHandoffNext('/hesap-silme'), '/hesap-silme')
    assert.equal(parseMobileHandoffNext('https://evil.example/plans'), null)
    assert.equal(parseMobileHandoffNext('/admin'), null)
  })
})
