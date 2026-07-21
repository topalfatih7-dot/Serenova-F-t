/**
 * Egzersiz description içine gömülen "Uygulama adımları" bloğunu kaldırır
 * ve instructions metinlerindeki bilinen çeviri artıklarını temizler.
 *
 * Kullanım:
 *   node scripts/cleanup-exercise-instruction-dupes.mjs --dry-run --limit=5
 *   node scripts/cleanup-exercise-instruction-dupes.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import {
  polishTurkishFitnessText,
  stripEmbeddedInstructionBlock,
} from './lib/exercise-translate-tr.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null

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

function normalizeSteps(instructions) {
  if (!Array.isArray(instructions)) return []
  return instructions
    .map((step) => {
      if (typeof step === 'string') return polishTurkishFitnessText(step)
      if (step && typeof step === 'object') {
        return polishTurkishFitnessText(String(step.text || step.description || step.step || ''))
      }
      return ''
    })
    .filter(Boolean)
}

function needsUpdate(row) {
  const nextDescription = stripEmbeddedInstructionBlock(row.description)
  const nextInstructions = normalizeSteps(row.instructions)
  const descChanged = nextDescription !== String(row.description || '').trim()
  const stepsChanged = JSON.stringify(nextInstructions) !== JSON.stringify(
    Array.isArray(row.instructions) ? row.instructions.map((s) => String(s || '').trim()).filter(Boolean) : [],
  )
  return { descChanged, stepsChanged, nextDescription, nextInstructions }
}

async function fetchExercises(supabase) {
  const rows = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, description, instructions')
      .order('name')
      .range(from, from + PAGE_SIZE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
    if (limit && rows.length >= limit) break
  }
  return limit ? rows.slice(0, limit) : rows
}

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY eksik (.env.local)')
    process.exit(1)
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } })
  const rows = await fetchExercises(supabase)
  console.log(`Toplam okunan: ${rows.length}${dryRun ? ' (dry-run)' : ''}`)

  let updated = 0
  let skipped = 0
  let descFixes = 0
  let stepFixes = 0

  for (const row of rows) {
    const { descChanged, stepsChanged, nextDescription, nextInstructions } = needsUpdate(row)
    if (!descChanged && !stepsChanged) {
      skipped += 1
      continue
    }
    if (descChanged) descFixes += 1
    if (stepsChanged) stepFixes += 1

    if (dryRun) {
      if (updated < 5) {
        console.log(`--- ${row.name}`)
        if (descChanged) {
          console.log('  description:', String(row.description || '').slice(0, 80), '→', nextDescription.slice(0, 80))
        }
        if (stepsChanged) {
          console.log('  instructions sample:', nextInstructions.slice(-1)[0])
        }
      }
      updated += 1
      continue
    }

    const payload = {}
    if (descChanged) payload.description = nextDescription
    if (stepsChanged) payload.instructions = nextInstructions

    const { error } = await supabase.from('exercises').update(payload).eq('id', row.id)
    if (error) {
      console.error('Update hata:', row.name, error.message)
      continue
    }
    updated += 1
    if (updated % 100 === 0) console.log(`  … ${updated} güncellendi`)
  }

  console.log(JSON.stringify({
    scanned: rows.length,
    updated,
    skipped,
    descFixes,
    stepFixes,
    dryRun,
  }, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
