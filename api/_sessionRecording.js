/**
 * Görüşme kaydı — admin listeleme ve oynatma linki.
 */

import { getSupabaseAdmin } from './_supabaseAdmin.js'
import { getRecordingAccessLink } from './_dailyApi.js'

export async function listSessionRecordings({ sessionId, limit = 50 } = {}) {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Supabase yapılandırması eksik.' }

  let query = admin
    .from('session_recordings')
    .select('*')
    .order('recorded_at', { ascending: false, nullsFirst: false })
    .limit(Math.min(Number(limit) || 50, 200))

  if (sessionId) query = query.eq('session_id', sessionId)

  const { data, error } = await query
  if (error) return { ok: false, error: error.message }
  return { ok: true, recordings: data || [] }
}

export async function getSessionRecordingUrl(recordingId) {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false, error: 'Supabase yapılandırması eksik.' }
  if (!process.env.DAILY_API_KEY) return { ok: false, error: 'DAILY_API_KEY tanımlı değil.' }

  const { data: row, error } = await admin
    .from('session_recordings')
    .select('daily_recording_id, status')
    .eq('id', recordingId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!row) return { ok: false, error: 'Kayıt bulunamadı.' }
  if (row.status !== 'ready') return { ok: false, error: 'Kayıt henüz hazır değil.' }

  try {
    const link = await getRecordingAccessLink(row.daily_recording_id)
    return {
      ok: true,
      downloadUrl: link.download_link,
      expires: link.expires,
    }
  } catch (e) {
    return { ok: false, error: String(e.message || e) }
  }
}
