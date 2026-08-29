/** TR IBAN — ISO 13616 / ISO 7064 MOD-97-10 */

export const TR_IBAN_LENGTH = 26

export function compactIban(value) {
  return String(value || '').replace(/[\s-]+/g, '').toUpperCase()
}

export function toIbanNumeric(str) {
  return String(str || '').replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55))
}

export function mod97(numericStr) {
  let remainder = 0
  const digits = String(numericStr || '')
  for (let i = 0; i < digits.length; i += 7) {
    remainder = Number(String(remainder) + digits.slice(i, i + 7)) % 97
  }
  return remainder
}

export function formatIbanDisplay(value) {
  const compact = compactIban(value)
  if (!compact) return ''
  return compact.replace(/(.{4})/g, '$1 ').trim()
}

/** Yazarken yalnızca TR + rakam; 26 karaktere kadar, 4’lü gruplu gösterim */
export function maskIbanInput(value) {
  let raw = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return ''
  if (raw === 'T') return 'TR'
  if (raw.startsWith('TR')) raw = `TR${raw.slice(2).replace(/\D/g, '')}`
  else if (raw.startsWith('T')) raw = `TR${raw.slice(1).replace(/\D/g, '')}`
  else raw = `TR${raw.replace(/\D/g, '')}`
  return formatIbanDisplay(raw.slice(0, TR_IBAN_LENGTH))
}

export function trIbanBankCode(value) {
  const compact = compactIban(value)
  if (compact.length < 9) return ''
  return compact.slice(4, 9)
}

export function isTrIbanFormat(value) {
  const compact = compactIban(value)
  return /^TR\d{24}$/.test(compact)
}

export function isValidTrIban(value) {
  const compact = compactIban(value)
  if (!isTrIbanFormat(compact)) return false
  if (compact[9] !== '0') return false
  const rearranged = compact.slice(4) + compact.slice(0, 4)
  return mod97(toIbanNumeric(rearranged)) === 1
}

export function buildTrIban(bankCode, account16) {
  const code = String(bankCode || '').replace(/\D/g, '').padStart(5, '0').slice(-5)
  const acct = String(account16 || '').replace(/\D/g, '').padStart(16, '0').slice(-16)
  const bban = `${code}0${acct}`
  const rem = mod97(toIbanNumeric(`${bban}TR00`))
  const check = String(98 - rem).padStart(2, '0')
  return `TR${check}${bban}`
}

export function ibanValidationMessage(value, expectedBankCode = '') {
  const compact = compactIban(value)
  if (!compact) return 'IBAN gerekli.'
  if (compact.length < TR_IBAN_LENGTH) return `IBAN eksik (${compact.length}/26).`
  if (!compact.startsWith('TR')) return 'Yalnızca Türkiye IBAN’ı (TR) kabul edilir.'
  if (!isTrIbanFormat(compact)) return 'IBAN TR ile başlamalı ve 24 rakam içermeli.'
  if (compact[9] !== '0') return 'IBAN ulusal rezerv hanesi geçersiz.'
  if (!isValidTrIban(compact)) return 'IBAN kontrol toplamı hatalı. Rakamları kontrol edin.'
  if (expectedBankCode && trIbanBankCode(compact) !== expectedBankCode) {
    return 'Seçilen banka ile IBAN banka kodu eşleşmiyor.'
  }
  return ''
}

export function isPayoutAccountComplete(account) {
  if (!account) return false
  const holder = String(account.accountHolderName || '').trim()
  return holder.length >= 3
    && Boolean(account.bankCode)
    && isValidTrIban(account.iban)
    && trIbanBankCode(account.iban) === String(account.bankCode)
}
