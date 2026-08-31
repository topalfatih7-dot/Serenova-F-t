import { supabase } from './supabaseClient'
import { getApiAuthHeaders } from './apiAuth'
import { rowToInfluencer, rowToInfluencerPayoutAccount, influencerPayoutAccountToRow } from '../utils/influencerAccount'
import { normalizeInfluencerCode } from '../utils/influencerCode'

export { rowToInfluencer, rowToInfluencerPayoutAccount }

export async function fetchOwnInfluencerPayoutAccount(influencerId) {
  if (!supabase || !influencerId) return null
  const { data, error } = await supabase
    .from('influencer_payout_accounts')
    .select('*')
    .eq('influencer_id', influencerId)
    .maybeSingle()
  if (error) throw error
  return rowToInfluencerPayoutAccount(data)
}

export async function fetchAllInfluencerPayoutAccounts() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('influencer_payout_accounts')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToInfluencerPayoutAccount)
}

export async function upsertInfluencerPayoutAccount(influencerId, form) {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.')
  const payload = influencerPayoutAccountToRow(influencerId, form)
  const { data, error } = await supabase
    .from('influencer_payout_accounts')
    .upsert(payload, { onConflict: 'influencer_id' })
    .select('*')
    .single()
  if (error) throw error
  return rowToInfluencerPayoutAccount(data)
}

export async function fetchInfluencerEarnings({ influencerId = null, all = false } = {}) {
  if (!supabase) return []
  let q = supabase.from('influencer_earnings').select('*').order('created_at', { ascending: false })
  if (!all && influencerId) q = q.eq('influencer_id', influencerId)
  const { data, error } = await q.limit(all ? 400 : 200)
  if (error) throw error
  return data || []
}

export async function updateInfluencerEarningStatus(id, status) {
  if (!supabase) throw new Error('Veritabanı bağlantısı yok.')
  const { error } = await supabase
    .from('influencer_earnings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function updateInfluencerSelfProfile(patch) {
  if (!supabase) return { success: false, error: 'Veritabanı bağlantısı yok.' }
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) return { success: false, error: 'Oturum gerekli.' }

  const { data: current, error: readErr } = await supabase
    .from('influencers')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()
  if (readErr) return { success: false, error: readErr.message }
  if (!current) return { success: false, error: 'Influencer kaydı bulunamadı.' }

  const nextData = {
    ...(current.data || {}),
    instagram: String(patch.instagram || '').trim(),
  }
  if (patch.tempPasswordIssued === false) nextData.tempPasswordIssued = false

  const { error } = await supabase
    .from('influencers')
    .update({
      name: String(patch.name || current.name || '').trim(),
      phone: String(patch.phone || '').trim(),
      data: nextData,
    })
    .eq('id', user.id)
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function validateInfluencerCodeApi(code) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { ok: false, valid: false, error: 'Oturum bulunamadı.' }
  }
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'influencer-validate-code', code: normalizeInfluencerCode(code) }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) return { ok: false, valid: false, error: json.error || 'Kod doğrulanamadı.' }
    return json
  } catch (e) {
    return { ok: false, valid: false, error: String(e?.message || e) }
  }
}

export async function adminUpsertInfluencer(payload) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı.' }
  }
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'influencer-admin-upsert', ...payload }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.ok === false) {
      return { success: false, error: json.error || 'Kayıt başarısız.' }
    }
    return { success: true, ...json }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

export async function adminDeleteInfluencer(id) {
  const headers = await getApiAuthHeaders()
  if (!headers.Authorization) {
    return { success: false, error: 'Oturum bulunamadı.' }
  }
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'influencer-admin-delete', id }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.ok === false) {
      return { success: false, error: json.error || 'Silinemedi.' }
    }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e?.message || e) }
  }
}

export async function fetchInfluencersForAdmin() {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(rowToInfluencer)
}
