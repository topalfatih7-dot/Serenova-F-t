/** DB'deki mevcut Türkçe açıklamalara terminoloji cilası uygular (yeniden çeviri yok). */
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { polishTurkishFitnessText } from './lib/exercise-translate-tr.mjs'

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

async function main() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  const rows = []
  const PAGE = 200
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, description, instructions')
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data?.length) break
    rows.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }

  let updated = 0
  for (const row of rows) {
    const description = polishTurkishFitnessText(row.description)
    const instructions = (row.instructions || []).map((s) => polishTurkishFitnessText(s))
    const changed = description !== row.description
      || JSON.stringify(instructions) !== JSON.stringify(row.instructions || [])
    if (!changed) continue
    const { error: upErr } = await supabase.from('exercises').update({ description, instructions }).eq('id', row.id)
    if (!upErr) updated++
  }
  console.log('Cila tamam:', updated, '/', rows.length)
}

main().catch((e) => { console.error(e); process.exit(1) })
