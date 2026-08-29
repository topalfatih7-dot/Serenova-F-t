import { compactIban } from './iban'
import { bankDisplayName, findBankByCode } from '../data/turkishBanks'

export function rowToPayoutAccount(row) {
  if (!row) return null
  const bankCode = String(row.bank_code || '').padStart(5, '0')
  const bank = findBankByCode(bankCode)
  return {
    staffId: row.staff_id,
    accountHolderName: row.account_holder_name || '',
    iban: compactIban(row.iban),
    bankCode: row.bank_code || '',
    bankName: row.bank_name || bank?.name || '',
    bankShort: bank?.short || bankDisplayName(row.bank_code, row.bank_name),
    accountType: row.account_type === 'business' ? 'business' : 'individual',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function payoutAccountToRow(staffId, form) {
  const bank = findBankByCode(form.bankCode)
  return {
    staff_id: staffId,
    account_holder_name: String(form.accountHolderName || '').trim(),
    iban: compactIban(form.iban),
    bank_code: String(form.bankCode || '').replace(/\D/g, '').padStart(5, '0'),
    bank_name: bank?.name || String(form.bankName || '').trim(),
    account_type: form.accountType === 'business' ? 'business' : 'individual',
    updated_at: new Date().toISOString(),
  }
}
