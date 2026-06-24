/**
 * Service-role Supabase istemcisi (yalnızca Vercel sunucu tarafı).
 * SUPABASE_SERVICE_ROLE_KEY RLS'yi atlar — asla tarayıcıya gönderilmez.
 *
 * Gerekli env:
 *   SUPABASE_URL                (veya VITE_SUPABASE_URL — ikisi de kabul edilir)
 *   SUPABASE_SERVICE_ROLE_KEY   (GİZLİ — Supabase Dashboard → Project Settings → API)
 */
import { createClient } from '@supabase/supabase-js'

let _admin = null

function normalizeUrl(raw) {
  const url = String(raw || '').trim().replace(/^["']|["']$/g, '')
  return /^https?:\/\/.+/.test(url) ? url : ''
}

export function getSupabaseUrl() {
  return (
    normalizeUrl(process.env.SUPABASE_URL) ||
    normalizeUrl(process.env.VITE_SUPABASE_URL) ||
    ''
  )
}

export function isSupabaseAdminConfigured() {
  return Boolean(getSupabaseUrl() && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseAdmin() {
  if (!isSupabaseAdminConfigured()) return null
  if (!_admin) {
    _admin = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return _admin
}
