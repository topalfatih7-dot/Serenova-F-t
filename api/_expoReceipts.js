/**
 * Expo push receipt poll — ticket yalnızca kuyruğa alındı demektir.
 * Gerçek teslimat ~15 dk sonra GET /v2/push/getReceipts.
 * DeviceNotRegistered → token sil; InvalidCredentials → Telegram ops alarm.
 *
 * Tetik: membership-expiry cron'una piggyback + ?task=push-receipts
 */

import { sendTelegramMessage } from './_telegramSend.js'
import { EXPO_RECEIPTS_URL, expoAuthHeaders } from './_expoPush.js'

const RECEIPT_BATCH = 300
const MIN_AGE_MS = 15 * 60 * 1000
const MAX_AGE_MS = 24 * 60 * 60 * 1000
let lastCredentialAlertAt = 0
const CREDENTIAL_ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000

function opsChatId() {
  return process.env.TELEGRAM_OPS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || ''
}

async function alertInvalidCredentials(count) {
  const now = Date.now()
  if (now - lastCredentialAlertAt < CREDENTIAL_ALERT_COOLDOWN_MS) return
  lastCredentialAlertAt = now
  const chatId = opsChatId()
  if (!chatId) {
    console.error('[expoReceipts] InvalidCredentials x', count, '(Telegram yok)')
    return
  }
  const text = [
    '<b>Expo InvalidCredentials</b>',
    `${count} push receipt APNs/FCM kimlik hatası döndü.`,
    'Expo Dashboard → Credentials bölümünü kontrol edin.',
  ].join('\n')
  const mailed = await sendTelegramMessage({ chatId, text })
  if (!mailed.ok) console.error('[expoReceipts] telegram', mailed.error)
}

async function fetchReceipts(ids) {
  const res = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      ...expoAuthHeaders(),
    },
    body: JSON.stringify({ ids }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json?.errors?.[0]?.message || `Expo receipts HTTP ${res.status}`)
  }
  return json?.data && typeof json.data === 'object' ? json.data : {}
}

/**
 * @returns {{ ok: boolean, checked: number, okCount: number, errors: number, staleRemoved: number, invalidCredentials: number }}
 */
export async function runPushReceiptsBatch(admin) {
  const now = Date.now()
  const minCreated = new Date(now - MAX_AGE_MS).toISOString()
  const maxCreated = new Date(now - MIN_AGE_MS).toISOString()

  const { data: rows, error } = await admin
    .from('push_receipts')
    .select('ticket_id, user_id, expo_push_token')
    .eq('status', 'pending')
    .gte('created_at', minCreated)
    .lte('created_at', maxCreated)
    .limit(1000)

  if (error) throw new Error(error.message || 'push_receipts okunamadı')

  const pending = rows || []
  if (!pending.length) {
    return {
      ok: true,
      checked: 0,
      okCount: 0,
      errors: 0,
      staleRemoved: 0,
      invalidCredentials: 0,
    }
  }

  let okCount = 0
  let errCount = 0
  let staleRemoved = 0
  let invalidCredentials = 0
  const staleTokens = []

  for (let i = 0; i < pending.length; i += RECEIPT_BATCH) {
    const chunk = pending.slice(i, i + RECEIPT_BATCH)
    const ids = chunk.map((r) => r.ticket_id).filter(Boolean)
    const receipts = await fetchReceipts(ids)

    for (const row of chunk) {
      const receipt = receipts[row.ticket_id]
      if (!receipt) continue
      const status = receipt.status === 'ok' ? 'ok' : 'error'
      const errorCode = receipt.details?.error || receipt.message || null
      if (status === 'ok') okCount += 1
      else errCount += 1

      if (errorCode === 'DeviceNotRegistered' && row.expo_push_token) {
        staleTokens.push(row.expo_push_token)
      }
      if (errorCode === 'InvalidCredentials') {
        invalidCredentials += 1
      }

      const { error: updErr } = await admin
        .from('push_receipts')
        .update({
          status,
          error_code: errorCode,
          checked_at: new Date().toISOString(),
        })
        .eq('ticket_id', row.ticket_id)
      if (updErr) console.warn('[expoReceipts] update', updErr.message)
    }
  }

  if (staleTokens.length) {
    const unique = [...new Set(staleTokens)]
    const { error: delErr, count } = await admin
      .from('device_push_tokens')
      .delete({ count: 'exact' })
      .in('expo_push_token', unique)
    if (delErr) console.warn('[expoReceipts] stale delete', delErr.message)
    else staleRemoved = count ?? unique.length
  }

  if (invalidCredentials > 0) {
    await alertInvalidCredentials(invalidCredentials)
  }

  // 24s+ hâlâ pending olanları error olarak kapat (receipt süresi doldu)
  await admin
    .from('push_receipts')
    .update({
      status: 'expired',
      checked_at: new Date().toISOString(),
    })
    .eq('status', 'pending')
    .lt('created_at', minCreated)

  return {
    ok: true,
    checked: pending.length,
    okCount,
    errors: errCount,
    staleRemoved,
    invalidCredentials,
  }
}
