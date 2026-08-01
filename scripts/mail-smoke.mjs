#!/usr/bin/env node
/**
 * Resend smoke test — .env.local'dan RESEND_API_KEY okur.
 *
 *   node scripts/mail-smoke.mjs --to=senin@gmail.com
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnvLocal() {
  const path = resolve(root, '.env.local')
  if (!existsSync(path)) return
  const text = readFileSync(path, 'utf8')
  for (const line of text.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = val
  }
}

function argValue(name) {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  return hit ? hit.slice(prefix.length) : ''
}

loadEnvLocal()

const to = argValue('to') || process.env.MAIL_SMOKE_TO || ''
const apiKey = String(process.env.RESEND_API_KEY || '').trim()
const from = String(process.env.MAIL_FROM || 'Yeni Form <info@yeniform.com>').trim()

if (!apiKey) {
  console.error('FAIL: RESEND_API_KEY yok (.env.local veya env).')
  process.exit(1)
}
if (!to.includes('@')) {
  console.error('FAIL: --to=email@ornek.com gerekli')
  process.exit(1)
}

const subject = `Yeni Form mail smoke — ${new Date().toISOString()}`
const html = `<p>Bu bir Resend smoke testidir.</p><p>Zaman: <strong>${new Date().toLocaleString('tr-TR')}</strong></p>`
const text = `Yeni Form mail smoke — ${new Date().toISOString()}`

console.log('Sending…')
console.log(`  from: ${from}`)
console.log(`  to:   ${to}`)

const res = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ from, to: [to], subject, html, text }),
})

const json = await res.json().catch(() => ({}))
if (!res.ok) {
  console.error('FAIL:', res.status, json?.message || json?.error || json)
  process.exit(1)
}

console.log('OK: id =', json.id)
console.log('Gelen kutusu / spam klasörünü kontrol et.')
