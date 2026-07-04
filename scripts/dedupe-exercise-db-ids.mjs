/**
 * 1600exercisedbpro — çakışan exercise id'lerini paket prefix'i ile düzeltir.
 * JSON id alanlarını günceller, eşleşen mp4/mov dosyalarını yeniden adlandırır.
 *
 * Kullanım:
 *   node scripts/dedupe-exercise-db-ids.mjs --dry-run
 *   node scripts/dedupe-exercise-db-ids.mjs
 *
 * Varsayılan kaynak: %USERPROFILE%/OneDrive/Desktop/1600exercisedbpro
 */

import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  renameSync,
  copyFileSync,
  existsSync,
} from 'node:fs'
import { join, relative, basename, dirname } from 'node:path'
import { homedir } from 'node:os'

const DEFAULT_ROOT = join(homedir(), 'OneDrive', 'Desktop', '1600exercisedbpro')
const dryRun = process.argv.includes('--dry-run')
const root = process.argv.find((a) => !a.startsWith('-') && a.endsWith('1600exercisedbpro')) || DEFAULT_ROOT

/** @type {{ json: string, slug: string, videoRoot: string }[]} */
const PACKS = [
  { json: '100 Gym Workouts/100 Gym Workouts/100gymworkouts.json', slug: 'gym100', videoRoot: '100 Gym Workouts' },
  { json: '100 Workouts/100workouts.json', slug: 'w100', videoRoot: '100 Workouts' },
  { json: '200 Workouts/200 Workouts/200workouts.json', slug: 'w200', videoRoot: '200 Workouts' },
  { json: '400 Women Workout/Women Workout/400homeworkout.json', slug: 'women400', videoRoot: '400 Women Workout' },
  { json: '430 Workouts/430 Workouts/100gymfemale.json', slug: 'gf100', videoRoot: '430 Workouts' },
  { json: '430 Workouts/430 Workouts/130gymworkouts.json', slug: 'gf130', videoRoot: '430 Workouts' },
  { json: '430 Workouts/430 Workouts/200gymfemale.json', slug: 'gf200', videoRoot: '430 Workouts' },
  { json: 'Face Exercise/face.json', slug: 'face', videoRoot: 'Face Exercise' },
  { json: 'Home Pilate/Home Pilate/pilate.json', slug: 'pilate-home', videoRoot: 'Home Pilate' },
  { json: 'Office/Office/office.json', slug: 'office', videoRoot: 'Office' },
  { json: 'Wall Pilate Workouts/wallpilate.json', slug: 'pilate-wall', videoRoot: 'Wall Pilate Workouts' },
  { json: 'Workouts/130workouts.json', slug: 'w130', videoRoot: 'Workouts' },
  { json: 'Yoga/Yoga.json', slug: 'yoga', videoRoot: 'Yoga' },
]

function walkFiles(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walkFiles(full, acc)
    else acc.push(full)
  }
  return acc
}

function makeNewId(slug, oldId) {
  const trimmed = String(oldId).trim()
  if (trimmed.startsWith(`${slug}-`)) return trimmed
  return `${slug}-${trimmed}`
}

function findVideosInRoot(videoRootPath, oldId) {
  if (!existsSync(videoRootPath)) return []
  const matches = []
  for (const file of walkFiles(videoRootPath)) {
    if (!/\.(mp4|mov)$/i.test(file)) continue
    if (basename(file).replace(/\.[^.]+$/i, '') === oldId) {
      matches.push(file)
    }
  }
  return matches
}

function backupJson(jsonPath) {
  const bak = `${jsonPath}.bak`
  if (!existsSync(bak)) copyFileSync(jsonPath, bak)
}

if (!existsSync(root)) {
  console.error('Klasör bulunamadı:', root)
  process.exit(1)
}

console.log(dryRun ? 'DRY RUN — dosya değişmeyecek\n' : 'CANLI — dosyalar güncelleniyor\n')
console.log('Kaynak:', root)

const report = {
  root,
  dryRun,
  packs: [],
  renamedVideos: [],
  missingVideos: [],
  errors: [],
}

const allNewIds = new Map()

for (const pack of PACKS) {
  const jsonPath = join(root, pack.json)
  const videoRootPath = join(root, pack.videoRoot)

  if (!existsSync(jsonPath)) {
    report.errors.push(`JSON yok: ${pack.json}`)
    continue
  }

  const exercises = JSON.parse(readFileSync(jsonPath, 'utf8'))
  if (!Array.isArray(exercises)) {
    report.errors.push(`JSON dizi değil: ${pack.json}`)
    continue
  }

  let renamed = 0
  let missing = 0

  for (const ex of exercises) {
    const oldId = String(ex.id)
    const newId = makeNewId(pack.slug, oldId)

    if (allNewIds.has(newId)) {
      report.errors.push(`Yeni id çakışması: ${newId} (${pack.json} + ${allNewIds.get(newId)})`)
    } else {
      allNewIds.set(newId, pack.json)
    }

    const videos = findVideosInRoot(videoRootPath, oldId)
    if (videos.length === 0) {
      missing++
      report.missingVideos.push({ pack: pack.slug, oldId, name: ex.name })
    } else if (videos.length > 1) {
      report.errors.push(`Aynı pakette birden fazla video: ${pack.slug}/${oldId} → ${videos.map((v) => relative(root, v)).join(', ')}`)
    } else {
      const src = videos[0]
      const ext = src.slice(src.lastIndexOf('.'))
      const dest = join(dirname(src), `${newId}${ext}`)
      if (src !== dest) {
        report.renamedVideos.push({ from: relative(root, src), to: relative(root, dest) })
        if (!dryRun) renameSync(src, dest)
        renamed++
      }
    }

    ex.id = newId
    ex.legacyId = oldId
    ex.packSlug = pack.slug
  }

  if (!dryRun) {
    backupJson(jsonPath)
    writeFileSync(jsonPath, `${JSON.stringify(exercises, null, 4)}\n`, 'utf8')
  }

  report.packs.push({
    slug: pack.slug,
    json: pack.json,
    exercises: exercises.length,
    renamed,
    missing,
  })
}

// Orphan videolar (yeniden adlandırılmamış eski id formatı)
const orphanVideos = []
for (const file of walkFiles(root)) {
  if (!/\.(mp4|mov)$/i.test(file)) continue
  const name = basename(file).replace(/\.[^.]+$/i, '')
  if (/^[a-z][a-z0-9]*-\d+$/i.test(name)) continue
  if (/^\d+$/.test(name)) orphanVideos.push(relative(root, file))
}

report.orphanLegacyVideos = orphanVideos

const reportPath = join(root, '_id_dedupe_report.json')
if (!dryRun) writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log('\nPaket özeti:')
for (const p of report.packs) {
  console.log(`  ${p.slug.padEnd(12)} ${String(p.exercises).padStart(4)} hareket | ${p.renamed} video yeniden adlandı | ${p.missing} video bulunamadı`)
}

console.log(`\nToplam benzersiz id: ${allNewIds.size}`)
console.log(`Hata: ${report.errors.length}`)
console.log(`Eksik video (json'da var, dosya yok): ${report.missingVideos.length}`)
console.log(`Yetim eski-format video (0101.mp4 gibi): ${orphanVideos.length}`)

if (report.errors.length) {
  console.log('\nHatalar:')
  report.errors.slice(0, 20).forEach((e) => console.log('  -', e))
}

if (!dryRun) console.log('\nRapor:', reportPath)

if (report.errors.length) process.exit(1)
