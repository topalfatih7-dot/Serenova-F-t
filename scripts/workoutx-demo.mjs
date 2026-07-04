#!/usr/bin/env node
/**
 * WorkoutX API deneme scripti.
 * Kullanım:
 *   WORKOUTX_API_KEY=wx_... node scripts/workoutx-demo.mjs
 * veya .env.local içine WORKOUTX_API_KEY ekleyip:
 *   node --env-file=.env.local scripts/workoutx-demo.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'https://api.workoutxapp.com/v1'

function loadKey() {
  if (process.env.WORKOUTX_API_KEY) return process.env.WORKOUTX_API_KEY
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return null
  const line = readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.startsWith('WORKOUTX_API_KEY='))
  return line ? line.split('=').slice(1).join('=').trim().replace(/^["']|["']$/g, '') : null
}

async function wx(path, params = {}) {
  const key = loadKey()
  if (!key) {
    console.error('WORKOUTX_API_KEY gerekli. Dashboard: https://workoutxapp.com/dashboard.html')
    process.exit(1)
  }
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url, { headers: { 'X-WorkoutX-Key': key } })
  const body = await res.json().catch(() => ({}))
  return { status: res.status, headers: res.headers, body }
}

function quota(headers) {
  const pick = (k) => headers.get(k) ?? '—'
  return {
    plan: pick('x-workoutx-plan'),
    quotaRemaining: pick('x-quota-remaining'),
    quotaLimit: pick('x-quota-limit'),
    rateRemaining: pick('x-ratelimit-remaining'),
  }
}

async function main() {
  console.log('WorkoutX API denemeleri\n')

  const deadlift = await wx('/exercises/exercise/0032')
  console.log('1) Barbell Deadlift (0032)', deadlift.status)
  console.log('   ', deadlift.body?.name, '|', deadlift.body?.target, '|', deadlift.body?.gifUrl)
  console.log('   quota:', quota(deadlift.headers))

  const chest = await wx('/exercises/bodyPart/chest', { limit: 3 })
  const chestList = Array.isArray(chest.body) ? chest.body : chest.body?.data ?? []
  console.log('\n2) Chest (ilk 3)', chest.status)
  chestList.slice(0, 3).forEach((e) => console.log('   -', e.id, e.name))

  const similar = await wx('/exercises/0025/similar', { limit: 3 })
  const simList = Array.isArray(similar.body) ? similar.body : similar.body?.data ?? []
  console.log('\n3) Bench Press (0025) benzerleri', similar.status)
  simList.slice(0, 3).forEach((e) => console.log('   -', e.id ?? e.exerciseId, e.name))

  const de = await wx('/exercises/exercise/0032', { lang: 'de' })
  console.log('\n4) Deadlift Almanca', de.status, '→', de.body?.name)

  const gif = await fetch(`${BASE}/gifs/0032`, {
    headers: { 'X-WorkoutX-Key': loadKey() },
  })
  console.log('\n5) GIF endpoint', gif.status, gif.headers.get('content-type'), `${gif.headers.get('content-length')} bytes`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
