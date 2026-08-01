#!/usr/bin/env node
/**
 * Yerel handler smoke — deploy gerekmez.
 * staff_decision_notify: bearer yok → 401.
 *
 *   node scripts/staff-decision-notify-local.mjs
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

const handler = (await import(resolve(root, 'api/contact.js'))).default

function mockRes() {
  const state = { statusCode: 200, body: null, headers: {} }
  const res = {
    status(code) {
      state.statusCode = code
      return res
    },
    json(payload) {
      state.body = payload
      return res
    },
    setHeader(k, v) {
      state.headers[k] = v
    },
    end() {},
  }
  return { res, state }
}

async function invoke(body, headers = {}) {
  const { res, state } = mockRes()
  const req = {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  }
  await handler(req, res)
  return { status: state.statusCode, json: state.body }
}

const unauth = await invoke({
  action: 'staff_decision_notify',
  applicationId: '00000000-0000-0000-0000-000000000000',
  decision: 'rejected',
})

if (unauth.status !== 401 && unauth.status !== 403) {
  console.error('FAIL unauth guard', unauth)
  process.exit(1)
}
console.log('OK  unauth guard', unauth.status, unauth.json?.error || '')

const badAction = await invoke({ action: 'not_a_real_action' })
if (badAction.status !== 400 || !/Geçersiz form/i.test(badAction.json?.error || '')) {
  console.error('FAIL bad action', badAction)
  process.exit(1)
}
console.log('OK  handler dispatch', badAction.json?.error || '')
console.log('OK  staff_decision_notify local smoke')
