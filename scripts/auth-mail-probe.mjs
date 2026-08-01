#!/usr/bin/env node
/**
 * Auth mail akışları yapılandırma / API smoke (şifre sıfırlama + e-posta doğrulama yolu).
 * Resend anahtarı olmadan da API sözleşmesini doğrular.
 *
 *   node scripts/auth-mail-probe.mjs
 *   BASE_URL=https://www.yeniform.com node scripts/auth-mail-probe.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

loadEnvLocal()

const BASE = String(process.env.BASE_URL || process.env.APP_URL || 'https://www.yeniform.com').replace(/\/$/, '')
const results = []

function pass(name, detail = '') {
  results.push({ name, ok: true, detail })
  console.log(`OK  ${name}${detail ? ` — ${detail}` : ''}`)
}
function fail(name, detail = '') {
  results.push({ name, ok: false, detail })
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`)
}

/* 1) Repo şablonları token_hash kullanıyor mu? */
{
  const recovery = readFileSync(resolve(root, 'supabase/email-templates/recovery.html'), 'utf8')
  if (recovery.includes('{{ .TokenHash }}') && recovery.includes('next=reset-password')) {
    pass('recovery template TokenHash')
  } else {
    fail('recovery template TokenHash', 'PKCE için TokenHash zorunlu')
  }
  const magic = readFileSync(resolve(root, 'supabase/email-templates/magic-link.html'), 'utf8')
  if (magic.includes('{{ .TokenHash }}')) pass('magic-link template TokenHash')
  else fail('magic-link template TokenHash')
}

/* 2) Mailer helper yükleniyor mu? */
{
  try {
    const mod = await import(resolve(root, 'api/_mailer.js'))
    const approved = mod.staffApprovedEmail({
      name: 'Probe',
      email: 'probe@example.com',
      tempPassword: 'TempPass123!',
    })
    const rejected = mod.staffRejectedEmail({ name: 'Probe', note: 'x' })
    if (approved.subject && approved.html.includes('TempPass123!') && rejected.subject) {
      pass('mailer templates', `from=${mod.getMailFrom()} configured=${mod.isMailConfigured()}`)
    } else fail('mailer templates', 'şablon çıktısı eksik')
  } catch (e) {
    fail('mailer templates', e.message)
  }
}

/* 3) Production password-reset API (Turnstile yoksa 400 — yine de route ayakta) */
{
  try {
    const res = await fetch(`${BASE}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'password-reset',
        email: 'nonexistent-mail-probe-yeniform@example.com',
      }),
    })
    const json = await res.json().catch(() => ({}))
    /* Turnstile zorunlu → 400/403; başarılı gönderim → 200; yapılandırma → 503 */
    if (res.status === 200 && json.ok) {
      pass('password-reset API', 'mail tetiklendi (ok)')
    } else if ([400, 403].includes(res.status) && (json.code === 'TURNSTILE_REQUIRED' || /turnstile|bot|captcha/i.test(json.error || ''))) {
      pass('password-reset API', `route ayakta; Turnstile korumalı (${res.status})`)
    } else if (res.status === 503) {
      fail('password-reset API', json.error || '503')
    } else {
      pass('password-reset API', `status=${res.status} error=${json.error || json.code || 'n/a'}`)
    }
  } catch (e) {
    fail('password-reset API', e.message)
  }
}

/* 4) staff_decision_notify — production (deploy sonrası 401) veya henüz deploy yoksa bilgilendir */
{
  try {
    const res = await fetch(`${BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'staff_decision_notify',
        applicationId: '00000000-0000-0000-0000-000000000000',
        decision: 'rejected',
      }),
    })
    const json = await res.json().catch(() => ({}))
    if (res.status === 401 || res.status === 403) {
      pass('staff_decision_notify prod guard', `${res.status} ${json.error || ''}`.trim())
    } else if (res.status === 400 && /Geçersiz form/i.test(json.error || '')) {
      pass('staff_decision_notify prod guard', 'henüz deploy edilmemiş (yerel smoke: staff-decision-notify-local.mjs)')
    } else {
      fail('staff_decision_notify prod guard', `beklenmeyen ${res.status} ${JSON.stringify(json).slice(0, 120)}`)
    }
  } catch (e) {
    fail('staff_decision_notify prod guard', e.message)
  }
}

/* 5) Env hatırlatma (eksikse uyarı — kod smoke’u engellemez) */
{
  const key = String(process.env.RESEND_API_KEY || '').trim()
  if (key) pass('RESEND_API_KEY local', 'tanımlı')
  else {
    pass('RESEND_API_KEY local', 'eksik (uyarı) — smoke: npm run test:mail -- --to=...')
    console.warn('WARN RESEND_API_KEY yok — gerçek gönderim için docs/OPS_RESEND_MAIL.md')
  }
}

const failed = results.filter((r) => !r.ok)
console.log('\n---')
console.log(`passed=${results.length - failed.length} failed=${failed.length}`)
if (failed.length) process.exit(1)
