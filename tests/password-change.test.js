import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { validatePasswordChangeFields } from '../api/_changePassword.js'

describe('password-change validation', () => {
  const valid = 'GoodPass1!'

  it('requires current, new, and confirm passwords', () => {
    assert.equal(validatePasswordChangeFields({}).ok, false)
    assert.equal(validatePasswordChangeFields({ currentPassword: 'x' }).ok, false)
    assert.equal(validatePasswordChangeFields({
      currentPassword: 'oldPass1!',
      newPassword: valid,
    }).ok, false)
  })

  it('rejects mismatched confirmation', () => {
    const result = validatePasswordChangeFields({
      currentPassword: 'OldPass1!',
      newPassword: valid,
      confirmPassword: 'OtherPass1!',
    })
    assert.equal(result.ok, false)
    assert.match(result.error, /eşleşmiyor/)
  })

  it('rejects new password equal to current', () => {
    const result = validatePasswordChangeFields({
      currentPassword: valid,
      newPassword: valid,
      confirmPassword: valid,
    })
    assert.equal(result.ok, false)
    assert.match(result.error, /farklı/)
  })

  it('rejects weak new password', () => {
    const result = validatePasswordChangeFields({
      currentPassword: 'OldPass1!',
      newPassword: 'short',
      confirmPassword: 'short',
    })
    assert.equal(result.ok, false)
  })

  it('accepts a valid change payload', () => {
    const result = validatePasswordChangeFields({
      currentPassword: 'OldPass1!',
      newPassword: valid,
      confirmPassword: valid,
    })
    assert.equal(result.ok, true)
    assert.equal(result.newPassword, valid)
  })
})
