/**
 * Eski başvuru notify endpoint'i — artık /api/contact (forms hub) üzerinden gider.
 * Geriye dönük çağrılar 410 döner (client secret ile spam engeli).
 */

import { setCorsHeaders, handleOptions } from './_guards.js'

export default async function handler(req, res) {
  if (handleOptions(req, res)) return
  setCorsHeaders(res, 'POST, OPTIONS', 'Content-Type', req)
  return res.status(410).json({
    ok: false,
    error: 'Bu endpoint kapatıldı. Başvurular /api/contact üzerinden gönderilmelidir.',
  })
}
