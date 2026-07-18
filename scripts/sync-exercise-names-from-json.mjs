/**
 * 1600exercisedbpro JSON → exercises.name (orijinal İngilizce, çeviri yok).
 *
 *   node scripts/sync-exercise-names-from-json.mjs
 *   node scripts/sync-exercise-names-from-json.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { EXERCISE_PACKS, DEFAULT_EXERCISE_DB_ROOT } from './lib/exercise-packs.mjs'
import { originalExerciseName } from '../src/data/exerciseImportMaps.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const path = join(root, '.env.local')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnv()

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const sourceRoot = args.find((a) => a.endsWith('1600exercisedbpro'))
  || process.env.EXERCISE_DB_ROOT
  || DEFAULT_EXERCISE_DB_ROOT
  || join(homedir(), 'Desktop', '1600exercisedbpro')

const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('SUPABASE_URL / SERVICE_ROLE_KEY gerekli (.env.local)')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

const updates = []
for (const pack of EXERCISE_PACKS) {
  const jsonPath = join(sourceRoot, pack.json)
  if (!existsSync(jsonPath)) {
    console.warn('JSON yok:', pack.json)
    continue
  }
  const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
  if (!Array.isArray(exercises)) continue
  for (const ex of exercises) {
    const name = originalExerciseName(ex.name)
    const sourceId = String(ex.id || '').trim()
    if (!name || !sourceId) continue
    updates.push({ source_pack: pack.slug, source_id: sourceId, name })
  }
}

console.log('Kaynak:', sourceRoot)
console.log('JSON isim sayısı:', updates.length)
if (dryRun) {
  console.log('DRY RUN — örnekler:')
  for (const row of updates.slice(0, 8)) {
    console.log(`  ${row.source_pack}/${row.source_id} → ${row.name}`)
  }
  process.exit(0)
}

let changed = 0
let missing = 0
let unchanged = 0
const BATCH = 80

for (let i = 0; i < updates.length; i += BATCH) {
  const batch = updates.slice(i, i + BATCH)
  await Promise.all(batch.map(async (row) => {
    const { data: existing, error: selErr } = await supabase
      .from('exercises')
      .select('id, name')
      .eq('source_pack', row.source_pack)
      .eq('source_id', row.source_id)
      .maybeSingle()
    if (selErr) {
      console.error('select', row.source_id, selErr.message)
      return
    }
    if (!existing) {
      missing += 1
      return
    }
    if (existing.name === row.name) {
      unchanged += 1
      return
    }
    const { error } = await supabase
      .from('exercises')
      .update({ name: row.name })
      .eq('id', existing.id)
    if (error) {
      console.error('update', row.source_id, error.message)
      return
    }
    changed += 1
  }))
  process.stdout.write(`\r  ${Math.min(i + BATCH, updates.length)}/${updates.length}`)
}

console.log('\nGüncellenen:', changed)
console.log('Zaten aynı:', unchanged)
console.log('DB’de yok:', missing)
