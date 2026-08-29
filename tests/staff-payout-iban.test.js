import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildTrIban,
  compactIban,
  formatIbanDisplay,
  ibanValidationMessage,
  isPayoutAccountComplete,
  isValidTrIban,
  maskIbanInput,
  trIbanBankCode,
} from '../src/utils/iban.js'
import { findBankByCode, searchBanks } from '../src/data/turkishBanks.js'

describe('TR IBAN', () => {
  it('builds a checksum-valid Ziraat IBAN and round-trips', () => {
    const iban = buildTrIban('00010', '1234567890123456')
    assert.equal(iban.length, 26)
    assert.equal(iban.startsWith('TR'), true)
    assert.equal(isValidTrIban(iban), true)
    assert.equal(trIbanBankCode(iban), '00010')
    assert.equal(iban[9], '0')
  })

  it('accepts spaced / lowercase input', () => {
    const iban = buildTrIban('00062', '1111222233334444')
    const spaced = formatIbanDisplay(iban.toLowerCase())
    assert.equal(isValidTrIban(spaced), true)
    assert.equal(compactIban(spaced), iban)
  })

  it('rejects tampered check digits and wrong length', () => {
    const iban = buildTrIban('00064', '9999888877776666')
    const broken = `${iban.slice(0, 2)}00${iban.slice(4)}`
    assert.equal(isValidTrIban(broken), false)
    assert.equal(isValidTrIban('TR64'), false)
    assert.equal(isValidTrIban('DE89370400440532013000'), false)
  })

  it('masks typing into TR + digits grouped by 4', () => {
    assert.equal(maskIbanInput('tr6400062'), 'TR64 0006 2')
    assert.equal(maskIbanInput('6400062'), 'TR64 0006 2')
  })

  it('flags bank mismatch', () => {
    const iban = buildTrIban('00067', '0000111122223333')
    assert.equal(ibanValidationMessage(iban, '00062').includes('eşleşmiyor'), true)
    assert.equal(ibanValidationMessage(iban, '00067'), '')
  })
})

describe('turkishBanks', () => {
  it('resolves padded EFT codes and search aliases', () => {
    assert.equal(findBankByCode('62')?.short, 'Garanti BBVA')
    assert.equal(findBankByCode('00111')?.short, 'QNB')
    const grouped = searchBanks('finansbank')
    assert.equal(grouped.deposit.some((b) => b.code === '00111'), true)
  })
})

describe('payout account mapping', () => {
  it('treats padded bank code + matching IBAN as a complete payout account', () => {
    const iban = buildTrIban('00046', '1212121212121212')
    assert.equal(isPayoutAccountComplete({
      accountHolderName: 'Ayşe Yılmaz',
      bankCode: '00046',
      iban,
    }), true)
    assert.equal(isPayoutAccountComplete({
      accountHolderName: 'Ayşe Yılmaz',
      bankCode: '00062',
      iban,
    }), false)
    const padded = String('15').replace(/\D/g, '').padStart(5, '0')
    assert.equal(padded, '00015')
    assert.equal(findBankByCode(padded)?.short, 'VakıfBank')
    assert.equal(compactIban(formatIbanDisplay(iban)), iban)
  })
})
