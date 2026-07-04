/**
 * Vercel Serverless — hareket kutuphanesi videolari icin sureli imzali URL.
 * Yalnizca oturum acmis kullanicilar (uye/kocu/admin) URL alabilir.
 * Gercek dosya adresi asla tarayiciya/istemciye kalici olarak verilmez.
 */

import { setCorsHeaders, handleOptions, requireAuth } from './_guards.js'
import { getSupabaseAdmin } from './_supabaseAdmin.js'

const BUCKET = 'exercise-videos'
const EXPIRES_IN_SECONDS = 60 * 60 // 1 saat

function isValidPath(path) {
  return typeof path === 'string' && /^[\w.-]+$/.test(path) && !path.includes('..')
}

export default async function handler(req, res) {
  setCorsHeaders(res)
  if (handleOptions(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST bekleniyor' })

  const auth = await requireAuth(req)
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {})
  const { path } = body

  if (!isValidPath(path)) {
    return res.status(400).json({ ok: false, error: 'Gecersiz video yolu' })
  }

  const admin = getSupabaseAdmin()
  if (!admin) {
    return res.status(503).json({ ok: false, error: 'Depolama yapilandirilmadi' })
  }

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(path, EXPIRES_IN_SECONDS)
  if (error || !data?.signedUrl) {
    return res.status(404).json({ ok: false, error: error?.message || 'Video bulunamadi' })
  }

  return res.status(200).json({
    ok: true,
    url: data.signedUrl,
    expiresAt: Date.now() + EXPIRES_IN_SECONDS * 1000,
  })
}
