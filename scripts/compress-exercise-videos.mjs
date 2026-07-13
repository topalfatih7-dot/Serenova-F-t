/**
 * exercise-videos MP4'lerini blueprint §1.1 sözleşmesine göre yeniden encode eder.
 * -c copy remux DEĞİL — libx264 + CRF 28 + -an + faststart.
 *
 *   node scripts/compress-exercise-videos.mjs --dry-run --limit=5
 *   node scripts/compress-exercise-videos.mjs --min-bytes=1500000 --limit=20
 *   node scripts/compress-exercise-videos.mjs --force --limit=5
 *   node scripts/compress-exercise-videos.mjs --concurrency=2
 *
 * En büyük dosyalardan başlar. Aynı storage path'e upsert (DB path korunur).
 * .mov → encode sonrası .mp4 path'e taşır + exercises.video_url günceller.
 *
 * Gereksinim: ffmpeg, SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync, mkdirSync, writeFileSync, unlinkSync, rmSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { requireFfmpeg } from './lib/ffmpeg-bin.mjs'
import {
  DEFAULT_MIN_BYTES,
  ENCODE_CACHE_CONTROL,
  encodeExerciseClip,
} from './lib/exercise-video-encode.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const force = args.includes('--force')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const prefixArg = args.find((a) => a.startsWith('--prefix='))
const prefix = prefixArg ? prefixArg.split('=')[1] : null
const minBytesArg = args.find((a) => a.startsWith('--min-bytes='))
const minBytes = minBytesArg
  ? parseInt(minBytesArg.split('=')[1], 10)
  : DEFAULT_MIN_BYTES
const concurrencyArg = args.find((a) => a.startsWith('--concurrency='))
const concurrency = Math.max(1, Math.min(4, concurrencyArg ? parseInt(concurrencyArg.split('=')[1], 10) : 2))

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

function formatBytes(n) {
  if (!Number.isFinite(n) || n < 0) return '?'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function targetPath(videoPath) {
  return /\.mov$/i.test(videoPath) ? videoPath.replace(/\.mov$/i, '.mp4') : videoPath
}

/** exercises.video_url path set + storage metadata sizes (largest first). */
async function fetchCandidates(supabase) {
  const pathSet = new Set()
  const pageSize = 1000
  let from = 0
  for (;;) {
    const { data, error } = await supabase
      .from('exercises')
      .select('video_url')
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
      if (!/\.(mp4|mov)$/i.test(path)) continue
      pathSet.add(path)
    }

    if (data.length < pageSize) break
    from += pageSize
  }

  const sizeByName = new Map()
  let offset = 0
  const listPage = 1000
  for (;;) {
    const { data, error } = await supabase.storage
      .from('exercise-videos')
      .list('', { limit: listPage, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw new Error(`storage.list: ${error.message}`)
    if (!data?.length) break
    for (const obj of data) {
      if (!obj?.name) continue
      const size = Number(obj.metadata?.size ?? obj.metadata?.contentLength ?? 0)
      sizeByName.set(obj.name, Number.isFinite(size) ? size : 0)
    }
    if (data.length < listPage) break
    offset += listPage
  }

  const candidates = []
  for (const path of pathSet) {
    const bytes = sizeByName.get(path) ?? 0
    // --force: skip-larger engelini kaldırır; min-bytes filtresi her zaman geçerli
    if (bytes > 0 && bytes < minBytes) continue
    candidates.push({ path, bytes })
  }

  candidates.sort((a, b) => b.bytes - a.bytes)
  return candidates
}

async function retargetDbPaths(supabase, fromPath, toPath) {
  if (fromPath === toPath) return { updated: 0 }
  const { data, error } = await supabase
    .from('exercises')
    .update({ video_url: toPath })
    .eq('video_url', fromPath)
    .select('id')
  if (error) throw new Error(`DB retarget ${fromPath}: ${error.message}`)
  return { updated: data?.length || 0 }
}

async function processOne(supabase, { path: videoPath, bytes }, workDir) {
  const outPath = targetPath(videoPath)
  const moved = outPath !== videoPath

  if (dryRun) {
    return {
      status: 'would-encode',
      videoPath,
      outPath,
      inBytes: bytes,
      moved,
    }
  }

  const { data: blob, error: dlErr } = await supabase.storage.from('exercise-videos').download(videoPath)
  if (dlErr || !blob) {
    return { status: 'error', videoPath, error: dlErr?.message || 'download failed' }
  }

  const safe = videoPath.replace(/[^\w.-]/g, '_')
  const inputFile = join(workDir, `in-${safe}`)
  const outputFile = join(workDir, `out-${safe}.mp4`)

  try {
    writeFileSync(inputFile, Buffer.from(await blob.arrayBuffer()))
    const inBytes = statSync(inputFile).size
    const encoded = encodeExerciseClip(FFMPEG, inputFile, outputFile)
    if (!encoded.ok) {
      return { status: 'error', videoPath, error: encoded.error }
    }

    // Never grow the file — keep original if encode is larger (rare with CRF).
    if (encoded.outBytes >= inBytes && !force) {
      return {
        status: 'skip-larger',
        videoPath,
        inBytes,
        outBytes: encoded.outBytes,
      }
    }

    const outBuf = readFileSync(outputFile)
    const { error: upErr } = await supabase.storage.from('exercise-videos').upload(outPath, outBuf, {
      contentType: 'video/mp4',
      cacheControl: ENCODE_CACHE_CONTROL,
      upsert: true,
    })
    if (upErr) {
      return { status: 'error', videoPath, error: upErr.message }
    }

    let dbUpdated = 0
    if (moved) {
      const ret = await retargetDbPaths(supabase, videoPath, outPath)
      dbUpdated = ret.updated
      await supabase.storage.from('exercise-videos').remove([videoPath])
    }

    return {
      status: 'encoded',
      videoPath,
      outPath,
      inBytes,
      outBytes: encoded.outBytes,
      saved: inBytes - encoded.outBytes,
      moved,
      dbUpdated,
    }
  } finally {
    try { unlinkSync(inputFile) } catch { /* ignore */ }
    try { unlinkSync(outputFile) } catch { /* ignore */ }
  }
}

async function mapPool(items, poolSize, worker) {
  let idx = 0
  async function run() {
    while (idx < items.length) {
      const i = idx++
      await worker(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: poolSize }, () => run()))
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let candidates = await fetchCandidates(supabase)
  if (prefix) candidates = candidates.filter((c) => c.path.startsWith(prefix))
  if (limit != null && Number.isFinite(limit)) candidates = candidates.slice(0, limit)

  const totalIn = candidates.reduce((s, c) => s + (c.bytes || 0), 0)
  console.log(
    `Compress encode: ${candidates.length} aday, min-bytes=${minBytes}, `
    + `concurrency=${concurrency}${prefix ? `, prefix=${prefix}` : ''}${force ? ', force' : ''}${dryRun ? ' (dry-run)' : ''}`,
  )
  console.log(`  aday toplam boyut: ${formatBytes(totalIn)} (en büyüğünden)`)

  if (!candidates.length) {
    console.log('İşlenecek dosya yok.')
    return
  }

  const workDir = join(tmpdir(), `serenova-compress-${Date.now()}`)
  mkdirSync(workDir, { recursive: true })

  let ok = 0
  let skipped = 0
  let errors = 0
  let done = 0
  let savedTotal = 0

  try {
    await mapPool(candidates, concurrency, async (item, i) => {
      const workerDir = join(workDir, `w${i % concurrency}`)
      mkdirSync(workerDir, { recursive: true })
      const result = await processOne(supabase, item, workerDir)
      done++

      if (result.status === 'encoded' || result.status === 'would-encode') {
        ok++
        if (result.saved) savedTotal += result.saved
        const sizeInfo = result.inBytes != null
          ? ` ${formatBytes(result.inBytes)}${result.outBytes != null ? ` → ${formatBytes(result.outBytes)}` : ''}`
          : ` ${formatBytes(item.bytes)}`
        const moveInfo = result.moved ? ` (→ ${result.outPath})` : ''
        console.log(`  ✓ ${result.status}: ${result.videoPath}${moveInfo}${sizeInfo}  [${done}/${candidates.length}]`)
      } else if (result.status === 'skip-larger') {
        skipped++
        console.log(
          `  · skip-larger: ${result.videoPath} `
          + `${formatBytes(result.inBytes)} → ${formatBytes(result.outBytes)}  [${done}/${candidates.length}]`,
        )
      } else {
        errors++
        console.warn(`  ✗ ${result.videoPath}: ${result.error}  [${done}/${candidates.length}]`)
      }
    })
  } finally {
    try { rmSync(workDir, { recursive: true, force: true }) } catch { /* ignore */ }
  }

  console.log(
    `\nTamamlandı: encode=${ok}, atlanan=${skipped}, hata=${errors}`
    + (savedTotal > 0 ? `, tasarruf≈${formatBytes(savedTotal)}` : ''),
  )
}

main().catch((e) => {
  console.error('\nHata:', e.message)
  process.exit(1)
})
