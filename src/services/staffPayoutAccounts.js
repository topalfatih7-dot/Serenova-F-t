import { supabase } from './supabaseClient'
import { payoutAccountToRow, rowToPayoutAccount } from '../utils/staffPayoutAccount'

export { payoutAccountToRow, rowToPayoutAccount }

export async function fetchOwnPayoutAccount(staffId) {
  if (!supabase || !staffId) return null
  const { data, error } = await supabase
    .from('staff_payout_accounts')
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle()
  if (error) throw error
  return rowToPayoutAccount(data)
}

export async function fetchAllPayoutAccounts() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('staff_payout_accounts')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToPayoutAccount)
}

export async function upsertPayoutAccount(staffId, form) {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.')
  const payload = payoutAccountToRow(staffId, form)
  const { data, error } = await supabase
    .from('staff_payout_accounts')
    .upsert(payload, { onConflict: 'staff_id' })
    .select('*')
    .single()
  if (error) throw error
  return rowToPayoutAccount(data)
}
