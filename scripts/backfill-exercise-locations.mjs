/**
 * 1600exercisedbpro → Supabase: yalnizca locations + requires_machine alanlarini gunceller.
 * Tam import (ceviri) yerine hizli metadata backfill.
 *
 *   node scripts/backfill-exercise-locations.mjs
 *   node scripts/backfill-exercise-locations.mjs --dry-run
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { EXERCISE_PACKS, DEFAULT_EXERCISE_DB_ROOT } from './lib/exercise-packs.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

const sourceRoot = args.find((a) => a.endsWith('1600exercisedbpro'))
  || process.env.EXERCISE_DB_ROOT
  || DEFAULT_EXERCISE_DB_ROOT
  || join(homedir(), 'Desktop', '1600exercisedbpro')

const VALID_LOCATIONS = new Set(['office', 'home', 'gym'])
const BATCH_SIZE = 100

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

function normalizeLocations(locations) {
  if (!Array.isArray(locations)) return []
  return [...new Set(
    locations
      .map((loc) => String(loc || '').trim().toLowerCase())
      .filter((loc) => VALID_LOCATIONS.has(loc)),
  )]
}

loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)')
    process.exit(1)
  }
  if (!existsSync(sourceRoot)) {
    console.error('Kaynak klasor bulunamadi:', sourceRoot)
    process.exit(1)
  }

  const rows = []
  for (const pack of EXERCISE_PACKS) {
    const jsonPath = join(sourceRoot, pack.json)
    if (!existsSync(jsonPath)) {
      console.warn('JSON yok, atlaniyor:', pack.json)
      continue
    }
    const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      rows.push({
        source_pack: pack.slug,
        source_id: String(ex.id),
        locations: normalizeLocations(ex.locations),
        requires_machine: ex.requiresMachine === true,
      })
    }
  }

  console.log(dryRun ? 'DRY RUN\n' : '')
  console.log('Kaynak:', sourceRoot)
  console.log('Guncellenecek kayit:', rows.length)

  if (dryRun) {
    const sample = rows.find((r) => r.locations.length > 0 && r.requires_machine)
      || rows.find((r) => r.locations.length > 0)
      || rows[0]
    console.log('Ornek:', sample)
    return
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let updated = 0
  let failed = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map(async (row) => {
      const { error } = await supabase
        .from('exercises')
        .update({
          locations: row.locations,
          requires_machine: row.requires_machine,
        })
        .eq('source_pack', row.source_pack)
        .eq('source_id', row.source_id)
      return error
    }))

    for (const error of results) {
      if (error) failed += 1
      else updated += 1
    }
    console.log(`  batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} satir`)
  }

  console.log('\nSonuc:', { updated, failed })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
