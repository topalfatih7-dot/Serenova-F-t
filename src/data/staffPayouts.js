/**
 * Personel hakediş iş kuralları — serbest meslek (hizmet sözleşmesi) modeli.
 * Üye ödemeleri ayrı; bu dosya yalnızca platform → personel hakedişini tanımlar.
 */

/** Tamamlanan ve faturalandırılabilir video görüşme başına net hakediş (TRY) */
export const STAFF_SESSION_RATE_TRY = 500

/** Minimum eşzamanlı görüşme süresi (dakika) — altında hakediş oluşmaz */
export const STAFF_MIN_OVERLAP_MINUTES = 15

/** Ödeme döngüsü: Cumartesi 00:00 → Cuma 23:59, ödeme Cuma */
export const STAFF_PAYOUT_CYCLE = 'weekly_friday'

/** Minimum ödeme eşiği — şu an yok; ileride eklenebilir */
export const STAFF_MIN_PAYOUT_THRESHOLD_TRY = 0

export const STAFF_PAYOUT_RULES = {
  /** Yalnızca video görüşme tamamlandığında */
  billableTypes: ['coach_session', 'dietitian_session'],
  /** Program, beslenme listesi vb. için hakediş yok */
  nonBillableTypes: ['nutrition_list', 'training_program', 'program_revision'],
  /** Her iki taraf da videoya katılmalı */
  requireBothParticipants: true,
  /** Personel serbest meslek — bordro değil, fatura beklenir */
  contractorModel: 'freelance',
  invoiceRequired: true,
}

export const STAFF_EARNING_STATUS = {
  pending: 'Onay bekliyor',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  reversed: 'İptal / iade',
  rejected: 'Reddedildi',
}

/** Hakediş satırı tutarı — şimdilik sabit görüşme ücreti */
export function sessionEarningAmount() {
  return STAFF_SESSION_RATE_TRY
}

export function formatStaffPayoutPeriodLabel(periodKey) {
  if (!periodKey) return '—'
  return periodKey.replace(/^(\d{4})-W(\d{2})$/, '$1 · Hafta $2')
}
