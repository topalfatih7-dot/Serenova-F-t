import { compactIban } from './iban'
import { bankDisplayName, findBankByCode } from '../data/turkishBanks'

export function rowToInfluencer(row) {
  if (!row) return null
  const data = row.data && typeof row.data === 'object' ? row.data : {}
  return {
    id: row.id,
    email: row.email || '',
    name: row.name || '',
    phone: row.phone || '',
    code: row.code || '',
    active: row.active !== false,
    instagram: data.instagram || '',
    tempPasswordIssued: data.tempPasswordIssued === true,
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToInfluencerPayoutAccount(row) {
  if (!row) return null
  const bankCode = String(row.bank_code || '').padStart(5, '0')
  const bank = findBankByCode(bankCode)
  return {
    influencerId: row.influencer_id,
    staffId: row.influencer_id,
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

export function influencerPayoutAccountToRow(influencerId, form) {
  const bank = findBankByCode(form.bankCode)
  return {
    influencer_id: influencerId,
    account_holder_name: String(form.accountHolderName || '').trim(),
    iban: compactIban(form.iban),
    bank_code: String(form.bankCode || '').replace(/\D/g, '').padStart(5, '0'),
    bank_name: bank?.name || String(form.bankName || '').trim(),
    account_type: form.accountType === 'business' ? 'business' : 'individual',
    updated_at: new Date().toISOString(),
  }
}
