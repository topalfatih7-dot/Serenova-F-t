import { createHmac, timingSafeEqual } from 'node:crypto'

const MAX_SKEW_SEC = 5 * 60

function header(headers, name) {
  const lower = name.toLowerCase()
  const raw = headers?.[name] ?? headers?.[lower]
  return Array.isArray(raw) ? String(raw[0] || '') : String(raw || '')
}

export function isResendWebhookRequest(req) {
  const headers = req?.headers || {}
  return Boolean(
    header(headers, 'svix-id')
    || header(headers, 'svix-signature')
    || header(headers, 'webhook-id'),
  )
}

function decodeWebhookSecret(secret) {
  const raw = String(secret || '').trim()
  if (!raw) return null
  const payload = raw.startsWith('whsec_') ? raw.slice(6) : raw
  try {
    return Buffer.from(payload, 'base64')
  } catch {
    return null
  }
}

function signaturesFromHeader(value) {
  return String(value || '')
    .split(' ')
    .map((part) => part.trim())
    .filter((part) => part.startsWith('v1,'))
    .map((part) => part.slice(3))
}

export function verifyResendWebhook({ payload, headers, secret, nowSec = Math.floor(Date.now() / 1000) }) {
  const key = decodeWebhookSecret(secret)
  if (!key?.length) {
    return { ok: false, error: 'RESEND_WEBHOOK_SECRET tanımlı değil.' }
  }

  const id = header(headers, 'svix-id') || header(headers, 'webhook-id')
  const timestamp = header(headers, 'svix-timestamp') || header(headers, 'webhook-timestamp')
  const signatureHeader = header(headers, 'svix-signature') || header(headers, 'webhook-signature')
  if (!id || !timestamp || !signatureHeader) {
    return { ok: false, error: 'Webhook imza başlıkları eksik.' }
  }

  const ts = Number(timestamp)
  if (!Number.isFinite(ts) || Math.abs(nowSec - ts) > MAX_SKEW_SEC) {
    return { ok: false, error: 'Webhook zaman damgası geçersiz.' }
  }

  const body = Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload || '')
  const expected = createHmac('sha256', key)
    .update(`${id}.${timestamp}.${body}`)
    .digest()

  const candidates = signaturesFromHeader(signatureHeader)
  if (!candidates.length) {
    return { ok: false, error: 'Webhook imzası yok.' }
  }

  let match = false
  for (const candidate of candidates) {
    let provided
    try {
      provided = Buffer.from(candidate, 'base64')
    } catch {
      continue
    }
    if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
      match = true
      break
    }
  }
  if (!match) return { ok: false, error: 'Webhook imzası geçersiz.' }

  try {
    return { ok: true, event: JSON.parse(body) }
  } catch {
    return { ok: false, error: 'Webhook gövdesi okunamadı.' }
  }
}
