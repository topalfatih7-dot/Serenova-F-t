export const STAFF_DOCS_BUCKET = 'staff-application-docs'
const SIGNED_TTL_SEC = 10 * 60

export function staffDocStoragePath(ref) {
  if (!ref) return null
  if (typeof ref === 'string') return pathFromUrlOrPath(ref)
  if (typeof ref.path === 'string' && isSafeStaffDocPath(ref.path)) return ref.path
  return pathFromUrlOrPath(ref.url)
}

export function isSafeStaffDocPath(path) {
  return typeof path === 'string'
    && /^[\w.-]+$/.test(path)
    && !path.includes('..')
    && path.length < 180
}

function pathFromUrlOrPath(value) {
  const raw = String(value || '').trim()
  if (!raw) return null
  if (isSafeStaffDocPath(raw)) return raw

  const markers = [
    `/object/public/${STAFF_DOCS_BUCKET}/`,
    `/object/sign/${STAFF_DOCS_BUCKET}/`,
    `/object/authenticated/${STAFF_DOCS_BUCKET}/`,
  ]
  for (const marker of markers) {
    const idx = raw.indexOf(marker)
    if (idx === -1) continue
    const sliced = decodeURIComponent(raw.slice(idx + marker.length).split('?')[0])
    if (isSafeStaffDocPath(sliced)) return sliced
  }
  return null
}

/** Admin oturumu ile kısa ömürlü imzalı URL. */
export async function resolveStaffApplicationDocUrl(ref) {
  const { supabase } = await import('../services/supabaseClient.js')
  const path = staffDocStoragePath(ref)
  if (path && supabase) {
    const { data, error } = await supabase.storage
      .from(STAFF_DOCS_BUCKET)
      .createSignedUrl(path, SIGNED_TTL_SEC)
    if (!error && data?.signedUrl) return data.signedUrl
  }
  const fallback = typeof ref === 'string' ? ref : ref?.url
  return fallback || null
}
