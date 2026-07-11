/**
 * 1600exercisedbpro → Supabase exercises (metadata-only varsayilan).
 *
 * Video guvenligi:
 *   - video_url yalnizca storage PATH tutar (ornek: gym100-0001.mp4)
 *   - Kalici public URL asla yazilmaz
 *   - video_pending=true → dosya henuz yuklenmedi; oynatma istegi yapilmaz
 *   - Yukleme sonrasi: node scripts/import-exercises.mjs --sync-video-status
 *
 * Kullanim:
 *   node scripts/import-exercises.mjs --dry-run
 *   node scripts/import-exercises.mjs --limit 20
 *   node scripts/import-exercises.mjs --pack yoga
 *   node scripts/import-exercises.mjs --upload-videos   (encode §1.1 + thumb)
 *   node scripts/import-exercises.mjs --sync-video-status
 *   node scripts/import-exercises.mjs --upsert-taxonomy
 */

import { readFileSync, readdirSync, statSync, existsSync, writeFileSync, unlinkSync } from 'node:fs'
import { join, basename, dirname } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { EXERCISE_PACKS, DEFAULT_EXERCISE_DB_ROOT, plannedVideoPath } from './lib/exercise-packs.mjs'
import { translateExerciseContent } from './lib/exercise-translate-tr.mjs'
import { resolveFfmpegPath } from './lib/ffmpeg-bin.mjs'
import { encodeExerciseClip, ENCODE_CACHE_CONTROL } from './lib/exercise-video-encode.mjs'
import {
  mapBodyPart,
  mapEquipment,
  mapDifficulty,
  localizeExerciseFields,
  IMPORT_TAXONOMY_BODY_PARTS,
  DEFERRED_IMPORT_PACKS,
} from '../src/data/exerciseImportMaps.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const uploadVideos = args.includes('--upload-videos')
const syncVideoStatus = args.includes('--sync-video-status')
const upsertTaxonomy = args.includes('--upsert-taxonomy')
const limitArg = args.find((a) => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null
const packFilter = args.find((a) => a.startsWith('--pack='))?.split('=')[1]
const sourceRoot = args.find((a) => a.endsWith('1600exercisedbpro'))
  || process.env.EXERCISE_DB_ROOT
  || DEFAULT_EXERCISE_DB_ROOT
  || join(homedir(), 'Desktop', '1600exercisedbpro')

const BATCH_SIZE = 50

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

function walkFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walkFiles(full, acc)
    else acc.push(full)
  }
  return acc
}

function findLocalVideo(videoRootPath, sourceId) {
  if (!existsSync(videoRootPath)) return null
  const id = String(sourceId)
  for (const file of walkFiles(videoRootPath)) {
    if (!/\.(mp4|mov)$/i.test(file)) continue
    const base = basename(file).replace(/\.[^.]+$/i, '')
    if (base === id) return file
  }
  // Pilates ozel: The Hundred.mp4
  if (id.endsWith('1114') && id.includes('pilate')) {
    for (const file of walkFiles(videoRootPath)) {
      if (/the hundred\.mp4$/i.test(file)) return file
    }
  }
  return null
}

const VALID_LOCATIONS = new Set(['office', 'home', 'gym'])

function normalizeLocations(locations) {
  if (!Array.isArray(locations)) return []
  return [...new Set(
    locations
      .map((loc) => String(loc || '').trim().toLowerCase())
      .filter((loc) => VALID_LOCATIONS.has(loc)),
  )]
}

async function mapRecord(ex, pack, { deferred = false, skipTranslate = false } = {}) {
  const sourceId = String(ex.id)
  const bodyPart = mapBodyPart(ex.bodyPart)
  const tr = localizeExerciseFields(ex, pack)
  const content = skipTranslate || dryRun
    ? { description: ex.description || '', instructions: ex.instructions || [] }
    : await translateExerciseContent({
      description: ex.description,
      instructions: ex.instructions,
    })
  const localVideo = findLocalVideo(join(sourceRoot, pack.videoRoot), sourceId)
  const ext = localVideo?.toLowerCase().endsWith('.mov') ? 'mov' : 'mp4'
  const videoPath = plannedVideoPath(pack.slug, sourceId, ext)

  return {
    name: tr.name,
    description: content.description,
    category: bodyPart,
    body_part: bodyPart,
    sport_type: pack.sportType,
    video_url: deferred ? '' : videoPath,
    video_pending: !deferred,
    source_pack: pack.slug,
    source_id: sourceId,
    equipment: mapEquipment(ex.equipment),
    target_muscle: tr.target_muscle,
    secondary_muscles: tr.secondary_muscles,
    difficulty: mapDifficulty(ex.difficulty),
    movement_category: tr.movement_category,
    instructions: content.instructions,
    locations: normalizeLocations(ex.locations),
    requires_machine: ex.requiresMachine === true,
    metadata: {
      legacyId: ex.legacyId || null,
      packSlug: ex.packSlug || pack.slug,
      importSource: '1600exercisedbpro',
      importStatus: deferred ? 'deferred' : 'ready',
      deferredReason: deferred ? 'Sonra eklenecek (yüz/ofis paketi)' : null,
      movementCategoryLabel: tr.movement_category_label,
      localVideoFound: Boolean(localVideo),
      plannedVideoPath: videoPath,
    },
    _localVideo: localVideo,
    _deferred: deferred,
  }
}

async function syncTaxonomyFromDb(supabase) {
  const { data, error } = await supabase.from('exercises').select('category')
  if (error) return
  const bodyParts = [...new Set((data || []).map((r) => r.category).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'tr'))
  if (!bodyParts.length) return

  const { data: existing } = await supabase
    .from('site_content')
    .select('id')
    .eq('kind', 'exercise_taxonomy')
    .limit(1)
    .maybeSingle()

  const payload = { sportTypes: [], bodyParts }
  if (dryRun) {
    console.log('[dry-run] taxonomy DB kategorileri:', bodyParts.join(', '))
    return
  }
  if (existing?.id) {
    await supabase.from('site_content').update({ data: payload }).eq('id', existing.id)
  } else {
    await supabase.from('site_content').insert({ kind: 'exercise_taxonomy', sort: 0, data: payload })
  }
  console.log('Filtre kategorileri guncellendi:', bodyParts.length, 'tip')
}

async function upsertTaxonomyRow(supabase) {
  const { data: existing } = await supabase
    .from('site_content')
    .select('id, data')
    .eq('kind', 'exercise_taxonomy')
    .limit(1)
    .maybeSingle()

  const payload = {
    sportTypes: [],
    bodyParts: IMPORT_TAXONOMY_BODY_PARTS,
  }

  if (dryRun) {
    console.log('[dry-run] taxonomy guncellenecek:', payload.bodyParts.length, 'kategori')
    return
  }

  if (existing?.id) {
    await supabase.from('site_content').update({ data: payload }).eq('id', existing.id)
    console.log('Taxonomy guncellendi:', existing.id)
  } else {
    const { data } = await supabase
      .from('site_content')
      .insert({ kind: 'exercise_taxonomy', sort: 0, data: payload })
      .select('id')
      .single()
    console.log('Taxonomy olusturuldu:', data?.id)
  }
}

async function syncVideoStatusFlags(supabase) {
  const { data: pending, error } = await supabase
    .from('exercises')
    .select('id, video_url')
    .eq('video_pending', true)

  if (error) throw error
  let cleared = 0
  for (const row of pending || []) {
    const path = row.video_url
    if (!path) continue
    if (dryRun) {
      console.log('[dry-run] video kontrol:', path)
      continue
    }
    const { error: dlErr } = await supabase.storage.from('exercise-videos').download(path)
    if (dlErr) continue
    await supabase.from('exercises').update({ video_pending: false }).eq('id', row.id)
    cleared++
  }
  console.log(`Video durumu senkron: ${cleared} kayit hazir olarak isaretlendi`)
}

/** Blueprint §1.1 encode; başarısızsa faststart remux'a düş. */
function prepareVideoForUpload(localPath) {
  const ffmpeg = resolveFfmpegPath()
  if (!ffmpeg) return null

  const encodedOut = join(tmpdir(), `enc-${Date.now()}-${basename(localPath)}.mp4`)
  const encoded = encodeExerciseClip(ffmpeg, localPath, encodedOut)
  if (encoded.ok) return encodedOut
  try { unlinkSync(encodedOut) } catch { /* ignore */ }

  const remuxOut = join(tmpdir(), `fs-${Date.now()}-${basename(localPath)}`)
  try {
    execFileSync(ffmpeg, [
      '-y', '-i', localPath,
      '-c', 'copy',
      '-movflags', '+faststart',
      remuxOut,
    ], { stdio: 'ignore' })
    return remuxOut
  } catch {
    try { unlinkSync(remuxOut) } catch { /* ignore */ }
    return null
  }
}

function extractThumbWebp(localPath) {
  const ffmpeg = resolveFfmpegPath()
  if (!ffmpeg) return null
  const out = join(tmpdir(), `thumb-${Date.now()}-${basename(localPath)}.webp`)
  try {
    execFileSync(ffmpeg, [
      '-y', '-ss', '0.5', '-i', localPath,
      '-frames:v', '1',
      '-vf', 'scale=480:-2',
      '-quality', '80',
      out,
    ], { stdio: 'ignore' })
    return out
  } catch {
    try { unlinkSync(out) } catch { /* ignore */ }
    return null
  }
}

async function uploadVideoBatch(supabase, records) {
  let uploaded = 0
  for (const rec of records) {
    if (!rec._localVideo) continue
    const path = rec.video_url
    if (dryRun) {
      console.log('[dry-run] upload:', path, '(+thumb +encode §1.1)')
      uploaded++
      continue
    }

    let uploadSource = rec._localVideo
    let prepared = null
    prepared = prepareVideoForUpload(rec._localVideo)
    if (prepared) uploadSource = prepared

    const buf = readFileSync(uploadSource)
    const { error } = await supabase.storage.from('exercise-videos').upload(path, buf, {
      cacheControl: ENCODE_CACHE_CONTROL,
      upsert: true,
      contentType: 'video/mp4',
    })
    if (prepared) {
      try { unlinkSync(prepared) } catch { /* ignore */ }
    }

    if (error) {
      console.warn('Upload hata:', path, error.message)
      continue
    }
    uploaded++

    const thumbPath = path.replace(/\.\w+$/, '.webp')
    const thumbFile = extractThumbWebp(rec._localVideo)
    if (thumbFile) {
      try {
        const thumbBuf = readFileSync(thumbFile)
        const { error: thumbErr } = await supabase.storage.from('exercise-thumbs').upload(thumbPath, thumbBuf, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true,
        })
        if (thumbErr) console.warn('Thumb hata:', thumbPath, thumbErr.message)
      } finally {
        try { unlinkSync(thumbFile) } catch { /* ignore */ }
      }
    }
  }
  return uploaded
}

async function main() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli (.env.local)')
    process.exit(1)
  }

  if (!existsSync(sourceRoot)) {
    console.error('Kaynak klasor bulunamadi:', sourceRoot)
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  if (upsertTaxonomy && syncVideoStatus) {
    await upsertTaxonomyRow(supabase)
  }

  if (syncVideoStatus) {
    await syncVideoStatusFlags(supabase)
    return
  }

  if (packFilter && DEFERRED_IMPORT_PACKS.includes(packFilter)) {
    console.error('Bu paket import edilmiyor (ertelenmiş):', packFilter)
    process.exit(1)
  }

  const activePacks = (packFilter
    ? EXERCISE_PACKS.filter((p) => p.slug === packFilter)
    : EXERCISE_PACKS.filter((p) => !DEFERRED_IMPORT_PACKS.includes(p.slug)))

  const deferredPacks = packFilter
    ? []
    : EXERCISE_PACKS.filter((p) => DEFERRED_IMPORT_PACKS.includes(p.slug))

  if (packFilter && activePacks.length === 0 && !DEFERRED_IMPORT_PACKS.includes(packFilter)) {
    console.error('Bilinmeyen pack:', packFilter)
    process.exit(1)
  }

  const allRecords = []
  const deferredManifest = []

  for (const pack of activePacks) {
    const jsonPath = join(sourceRoot, pack.json)
    if (!existsSync(jsonPath)) {
      console.warn('JSON yok, atlaniyor:', pack.json)
      continue
    }
    const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      allRecords.push(await mapRecord(ex, pack))
    }
  }

  for (const pack of deferredPacks) {
    const jsonPath = join(sourceRoot, pack.json)
    if (!existsSync(jsonPath)) continue
    const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
    if (!Array.isArray(exercises)) continue
    for (const ex of exercises) {
      const rec = await mapRecord(ex, pack, { deferred: true, skipTranslate: true })
      deferredManifest.push({
        source_pack: pack.slug,
        source_id: String(ex.id),
        name: rec.name,
        category: rec.category,
        plannedVideoPath: rec.metadata.plannedVideoPath,
        note: 'Sonra eklenecek — import sırasında atlandı',
      })
    }
  }

  const deferredPath = join(root, 'scripts/data/deferred-exercise-packs.json')
  if (deferredManifest.length && !dryRun) {
    writeFileSync(deferredPath, `${JSON.stringify({
      updatedAt: new Date().toISOString(),
      packs: DEFERRED_IMPORT_PACKS,
      total: deferredManifest.length,
      exercises: deferredManifest,
    }, null, 2)}\n`, 'utf8')
  }

  const slice = limit ? allRecords.slice(0, limit) : allRecords
  console.log(dryRun ? 'DRY RUN\n' : '')
  console.log('Kaynak:', sourceRoot)
  console.log('Kayit:', slice.length, '/', allRecords.length)
  console.log('Ertelenen (face/office):', deferredManifest.length, '→ scripts/data/deferred-exercise-packs.json')
  console.log('Mod:', uploadVideos ? 'metadata + video upload' : 'metadata-only (video_pending=true)')

  if (upsertTaxonomy) await upsertTaxonomyRow(supabase)

  let inserted = 0
  let skipped = 0

  for (let i = 0; i < slice.length; i += BATCH_SIZE) {
    const batch = slice.slice(i, i + BATCH_SIZE)
    const rows = batch.map(({ _localVideo, _deferred, ...row }) => row)

    if (dryRun) {
      inserted += rows.length
      if (i === 0) console.log('Ornek:', rows[0]?.name, '→', rows[0]?.video_url)
      continue
    }

    const { error } = await supabase
      .from('exercises')
      .upsert(rows, { onConflict: 'source_pack,source_id', ignoreDuplicates: false })

    if (error) {
      console.error('Batch hata:', error.message)
      skipped += batch.length
      continue
    }

    inserted += batch.length

    if (uploadVideos) {
      const up = await uploadVideoBatch(supabase, batch)
      console.log(`  batch ${i / BATCH_SIZE + 1}: ${up} video yuklendi`)
      for (const rec of batch) {
        if (!rec._localVideo) continue
        await supabase
          .from('exercises')
          .update({ video_pending: false })
          .eq('source_pack', rec.source_pack)
          .eq('source_id', rec.source_id)
      }
    }
  }

  console.log('\nSonuc:', { inserted, skipped, videoPending: !uploadVideos })
  if (packFilter && !dryRun) await syncTaxonomyFromDb(supabase)
  if (!uploadVideos) {
    console.log('\nVideo yukleme (ayri adim):')
    console.log('  node scripts/import-exercises.mjs --upload-videos')
    console.log('  node scripts/import-exercises.mjs --sync-video-status')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
