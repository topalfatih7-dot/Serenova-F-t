const TR_MAP = {
  ç: 'C', Ç: 'C', ğ: 'G', Ğ: 'G', ı: 'I', I: 'I', i: 'I', İ: 'I',
  ö: 'O', Ö: 'O', ş: 'S', Ş: 'S', ü: 'U', Ü: 'U',
}

export const INFLUENCER_CODE_STORAGE_KEY = 'yf-influencer-code'
export const INFLUENCER_CODE_MIN = 4
export const INFLUENCER_CODE_MAX = 20

export function normalizeInfluencerCode(raw) {
  return String(raw || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

export function isValidInfluencerCodeFormat(raw) {
  const code = normalizeInfluencerCode(raw)
  return code.length >= INFLUENCER_CODE_MIN && code.length <= INFLUENCER_CODE_MAX
}

export function suggestInfluencerCode(name) {
  const mapped = String(name || '')
    .split('')
    .map((ch) => TR_MAP[ch] || ch)
    .join('')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, INFLUENCER_CODE_MAX)
  if (mapped.length >= INFLUENCER_CODE_MIN) return mapped.slice(0, 8)
  return mapped
}

export function readStoredInfluencerCode() {
  try {
    return normalizeInfluencerCode(sessionStorage.getItem(INFLUENCER_CODE_STORAGE_KEY) || '')
  } catch {
    return ''
  }
}

export function storeInfluencerCode(raw) {
  const code = normalizeInfluencerCode(raw)
  try {
    if (code) sessionStorage.setItem(INFLUENCER_CODE_STORAGE_KEY, code)
    else sessionStorage.removeItem(INFLUENCER_CODE_STORAGE_KEY)
  } catch { /* private mode */ }
  return code
}

export function captureInfluencerRefFromSearch(search) {
  if (!search) return ''
  const params = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search
  const raw = params.get('ref') || params.get('indirim') || ''
  const code = normalizeInfluencerCode(raw)
  if (code) storeInfluencerCode(code)
  return code
}
