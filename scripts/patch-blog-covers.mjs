/**
 * Mevcut blog yazılarına kategori bazlı kapak görseli ekler.
 * node scripts/patch-blog-covers.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { coverForCategory } from '../src/utils/blogImages.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv(name) {
  const path = resolve(root, name)
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv('.env.local')
loadEnv('.env.production.local')

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')
  process.exit(1)
}

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const { data: rows, error } = await admin.from('posts').select('id, data')
if (error) {
  console.error(error.message)
  process.exit(1)
}

let updated = 0
for (const row of rows || []) {
  const data = row.data || {}
  if (data.coverImage) continue
  const cover = coverForCategory(data.category || 'Yaşam')
  const { error: upErr } = await admin.from('posts').update({
    data: { ...data, ...cover, updatedAt: new Date().toISOString().split('T')[0] },
  }).eq('id', row.id)
  if (!upErr) {
    updated += 1
    console.log('✓', data.title?.slice(0, 50) || row.id)
  } else {
    console.error('✗', row.id, upErr.message)
  }
}

console.log(`\n${updated} yazıya kapak görseli eklendi.`)
