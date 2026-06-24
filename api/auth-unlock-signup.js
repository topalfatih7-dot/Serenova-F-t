/**
 * POST /api/auth-unlock-signup
 * Kayıt sonrası e-posta onayı bekleyen kullanıcıyı hemen giriş yapabilir hale getirir.
 * E-posta doğrulaması profilden isteğe bağlı yapılır.
 *
 * Body: { email, password }
 * Gerekli env: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL (veya VITE_SUPABASE_URL)
 */
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin, getSupabaseUrl, isSupabaseAdminConfigured } from './_supabaseAdmin.js'

function getAnonKey() {
  return process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Yalnızca POST desteklenir' })

  if (!isSupabaseAdminConfigured()) {
    return res.status(503).json({
      ok: false,
      error: 'Sunucu yapılandırması eksik. SUPABASE_SERVICE_ROLE_KEY tanımlayın veya Supabase\'te "Confirm email" seçeneğini kapatın.',
    })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})
    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'E-posta ve şifre gerekli.' })
    }

    const url = getSupabaseUrl()
    const anonKey = getAnonKey()
    if (!url || !anonKey) {
      return res.status(503).json({ ok: false, error: 'Supabase URL veya anon anahtarı eksik.' })
    }

    const anon = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: signInErr } = await anon.auth.signInWithPassword({ email, password })
    if (signInErr) {
      const unconfirmed = /not confirmed|confirm/i.test(signInErr.message)
      if (!unconfirmed) {
        return res.status(401).json({ ok: false, error: 'E-posta veya şifre hatalı.' })
      }
    } else {
      await anon.auth.signOut()
    }

    const admin = getSupabaseAdmin()
    const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listErr) throw listErr

    const user = (listData?.users || []).find((u) => (u.email || '').toLowerCase() === email)
    if (!user) {
      return res.status(404).json({ ok: false, error: 'Kullanıcı bulunamadı.' })
    }

    const { error: updateErr } = await admin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })
    if (updateErr) throw updateErr

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || 'Kayıt açılamadı.' })
  }
}
