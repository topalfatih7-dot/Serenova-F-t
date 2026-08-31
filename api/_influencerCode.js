import { INFLUENCER_DISCOUNT_PERCENT } from '../src/data/influencerPayouts.js'

const CODE_RE = /^[A-Z0-9]{4,20}$/

export function normalizeInfluencerCodeServer(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function isInfluencerCodeFormat(raw) {
  return CODE_RE.test(normalizeInfluencerCodeServer(raw))
}

export async function lookupActiveInfluencerByCode(admin, code) {
  const normalized = normalizeInfluencerCodeServer(code)
  if (!CODE_RE.test(normalized)) return null
  const { data, error } = await admin
    .from('influencers')
    .select('id, email, name, code, active')
    .eq('code', normalized)
    .eq('active', true)
    .maybeSingle()
  if (error) throw error
  return data || null
}

export function isSelfInfluencerUse(user, influencer) {
  if (!user || !influencer) return false
  if (String(user.id) === String(influencer.id)) return true
  const a = String(user.email || '').trim().toLowerCase()
  const b = String(influencer.email || '').trim().toLowerCase()
  return Boolean(a && b && a === b)
}

export { INFLUENCER_DISCOUNT_PERCENT }
