/**
 * Mevcut exercise-videos dosyalarından exercise-thumbs/.webp kapak üretir.
 *
 *   node scripts/generate-exercise-thumbs.mjs --dry-run --limit=5
 *   node scripts/generate-exercise-thumbs.mjs
 *   node scripts/generate-exercise-thumbs.mjs --limit=50
 *   node scripts/generate-exercise-thumbs.mjs --concurrency=6
 *
 * Gereksinim: ffmpeg (PATH veya ffmpeg-static), SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, rmSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { requireFfmpeg } from './lib/ffmpeg-bin.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const prefixArg = args.find((a) => a.startsWith('--prefix='))
const prefix = prefixArg ? prefixArg.split('=')[1] : null
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(8, concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 4))

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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const FFMPEG = requireFfmpeg()

function videoPathToThumbPath(videoPath) {
  return String(videoPath).replace(/\.\w+$/, '.webp')
}

async function thumbExists(supabase, thumbPath) {
  const { data } = supabase.storage.from('exercise-thumbs').getPublicUrl(thumbPath)
  const url = data?.publicUrl
  if (!url) return false
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

async function fetchAllVideoPaths(supabase) {
  const paths = []
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, video_url')
      .eq('video_pending', false)
      .not('video_url', 'is', null)
      .neq('video_url', '')
      .range(from, from + pageSize - 1)

    if (error) throw new Error(`exercises: ${error.message}`)
    if (!data?.length) break

    for (const row of data) {
      const path = String(row.video_url || '').trim().split('?')[0]
      if (!path || /^https?:\/\//.test(path) || /youtube|youtu\.be/i.test(path)) continue
      if (!/^[\w.-]+$/.test(path)) continue
      paths.push(path)
    }

    if (data.length < pageSize) break
    from += pageSize
  }
  return [...new Set(paths)]
}

async function processOne(supabase, videoPath, workDir) {
  const thumbPath = videoPathToThumbPath(videoPath)
  const exists = await thumbExists(supabase, thumbPath)
  if (exists) {
    return { status: 'skip', videoPath, thumbPath }
  }

  if (dryRun) {
    return { status: 'would-create', videoPath, thumbPath }
  }

  const { data: blob, error: dlErr } = await supabase.storage.from('exercise-videos').download(videoPath)
  if (dlErr || !blob) {
    return { status: 'error', videoPath, thumbPath, error: dlErr?.message || 'download failed' }
  }

  const safe = videoPath.replace(/[^\w.-]/g, '_')
  const inputFile = join(workDir, `in-${safe}`)
  const outputFile = join(workDir, `out-${safe}.webp`)

  try {
    const buf = Buffer.from(await blob.arrayBuffer())
    writeFileSync(inputFile, buf)
    execFileSync(FFMPEG, [
      '-y', '-ss', '0.5', '-i', inputFile,
      '-frames:v', '1',
      '-vf', 'scale=480:-2',
      '-quality', '80',
      outputFile,
    ], { stdio: 'ignore' })

    const thumbBuf = readFileSync(outputFile)
    const { error: upErr } = await supabase.storage.from('exercise-thumbs').upload(thumbPath, thumbBuf, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true,
    })
    if (upErr) {
      return { status: 'error', videoPath, thumbPath, error: upErr.message }
    }
    return { status: 'created', videoPath, thumbPath }
  } finally {
    try { unlinkSync(inputFile) } catch { /* ignore */ }
    try { unlinkSync(outputFile) } catch { /* ignore */ }
  }
}

async function mapPool(items, poolSize, worker) {
  let idx = 0
  const results = []
  async function run() {
    while (idx < items.length) {
      const i = idx++
      results[i] = await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: poolSize }, () => run()))
  return results
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let paths = await fetchAllVideoPaths(supabase)
  if (prefix) paths = paths.filter((p) => p.startsWith(prefix))
  if (limit != null && Number.isFinite(limit)) paths = paths.slice(0, limit)

  console.log(`Thumb üretimi: ${paths.length} video, concurrency=${concurrency}${prefix ? ` prefix=${prefix}` : ''}${dryRun ? ' (dry-run)' : ''}`)

  const workDir = join(tmpdir(), `serenova-thumbs-${Date.now()}`)
  mkdirSync(workDir, { recursive: true })

  let created = 0
  let skipped = 0
  let errors = 0
  let done = 0

  try {
    await mapPool(paths, concurrency, async (path, i) => {
      const workerDir = join(workDir, `w${i % concurrency}`)
      mkdirSync(workerDir, { recursive: true })
      const result = await processOne(supabase, path, workerDir)
      done++
      if (result.status === 'created' || result.status === 'would-create') {
        created++
        console.log(`  ✓ ${result.status}: ${result.videoPath} → ${result.thumbPath}  [${done}/${paths.length}]`)
      } else if (result.status === 'skip') {
        skipped++
        if (skipped % 50 === 0 || done === paths.length) {
          console.log(`  · atlanan=${skipped}  [${done}/${paths.length}]`)
        }
      } else {
        errors++
        console.warn(`  ✗ ${result.videoPath}: ${result.error}  [${done}/${paths.length}]`)
      }
      return result
    })
  } finally {
    try { rmSync(workDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }

  console.log(`\nTamamlandı: oluşturulacak/oluşturulan=${created}, atlanan=${skipped}, hata=${errors}`)
}

main().catch((e) => {
  console.error('\nHata:', e.message)
  process.exit(1)
})
