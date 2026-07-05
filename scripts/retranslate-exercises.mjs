/**
 * DB'deki egzersiz açıklamalarını İngilizce kaynaktan düzgün Türkçeye çevirir.
 * İsimler (name) değiştirilmez.
 *
 * Kullanım:
 *   node scripts/retranslate-exercises.mjs --dry-run --limit=5
 *   node scripts/retranslate-exercises.mjs
 *   node scripts/retranslate-exercises.mjs --pack=gym100
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { EXERCISE_PACKS, DEFAULT_EXERCISE_DB_ROOT } from './lib/exercise-packs.mjs'
import { translateExerciseContent } from './lib/exercise-translate-tr.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const packFilter = args.find((a) => a.startsWith('--pack='))?.split('=')[1]
const sourceRoot = args.find((a) => a.endsWith('1600exercisedbpro'))
  || process.env.EXERCISE_DB_ROOT
  || DEFAULT_EXERCISE_DB_ROOT
  || join(homedir(), 'Desktop', '1600exercisedbpro')

const PAGE_SIZE = 100

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

function buildEnglishIndex() {
  const index = new Map()
  for (const pack of EXERCISE_PACKS) {
    if (packFilter && pack.slug !== packFilter) continue
    const jsonPath = join(sourceRoot, pack.json)
    if (!existsSync(jsonPath)) {
      console.warn('JSON yok:', pack.json)
      continue
    }
    const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      index.set(`${pack.slug}:${String(ex.id)}`, ex)
    }
  }
  return index
}

async function fetchExercises(supabase) {
  const rows = []
  let from = 0
  while (true) {
    let q = supabase
      .from('exercises')
      .select('id, name, source_pack, source_id')
      .order('source_pack')
      .order('source_id')
      .range(from, from + PAGE_SIZE - 1)
    if (packFilter) q = q.eq('source_pack', packFilter)
    const { data, error } = await q
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return limit ? rows.slice(0, limit) : rows
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli')
    process.exit(1)
  }
  if (!existsSync(sourceRoot)) {
    console.error('Kaynak klasör yok:', sourceRoot)
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const englishIndex = buildEnglishIndex()
  const exercises = await fetchExercises(supabase)

  console.log(dryRun ? 'DRY RUN\n' : '')
  console.log('Kaynak:', sourceRoot)
  console.log('İngilizce indeks:', englishIndex.size, 'kayıt')
  console.log('DB hedef:', exercises.length, 'egzersiz')
  if (packFilter) console.log('Paket filtresi:', packFilter)

  let updated = 0
  let skipped = 0
  let missing = 0

  for (let i = 0; i < exercises.length; i++) {
    const row = exercises[i]
    const key = `${row.source_pack}:${row.source_id}`
    const source = englishIndex.get(key)

    if (!source) {
      missing++
      console.warn(`[${i + 1}/${exercises.length}] Kaynak yok: ${key} (${row.name})`)
      continue
    }

    const { description, instructions } = await translateExerciseContent({
      description: source.description,
      instructions: source.instructions,
    })

    if (dryRun) {
      if (i < 3) {
        console.log(`\n--- ${row.name} ---`)
        console.log(description.slice(0, 320) + (description.length > 320 ? '…' : ''))
      }
      updated++
      continue
    }

    const { error } = await supabase
      .from('exercises')
      .update({ description, instructions })
      .eq('id', row.id)

    if (error) {
      skipped++
      console.error('Güncelleme hatası:', row.name, error.message)
      continue
    }

    updated++
    if (updated % 25 === 0 || i === exercises.length - 1) {
      console.log(`İlerleme: ${i + 1}/${exercises.length} (${updated} güncellendi)`)
    }
  }

  console.log('\nSonuç:', { updated, skipped, missingSource: missing, dryRun })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
