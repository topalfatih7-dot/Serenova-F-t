/**
 * Storage bucket nesnelerini kaynak → hedef kopyalar.
 *
 * Env:
 *   SOURCE_SUPABASE_URL, SOURCE_SUPABASE_SERVICE_ROLE_KEY
 *   TARGET_SUPABASE_URL, TARGET_SUPABASE_SERVICE_ROLE_KEY
 *
 * Kullanım: node scripts/migrate-storage-buckets.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'

const dry = process.argv.includes('--dry-run')
const BUCKETS = [
  { id: 'exercise-videos', public: false },
  { id: 'exercise-thumbs', public: true },
  { id: 'health-lab-results', public: false },
]

function req(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Eksik env: ${name}`)
  return v
}

const source = createClient(req('SOURCE_SUPABASE_URL'), req('SOURCE_SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})
const target = createClient(req('TARGET_SUPABASE_URL'), req('TARGET_SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function ensureBucket(client, { id, public: isPublic }) {
  const { data: list } = await client.storage.listBuckets()
  if ((list || []).some((b) => b.id === id || b.name === id)) return
  const { error } = await client.storage.createBucket(id, { public: isPublic })
  if (error && !/already|exists/i.test(error.message)) throw error
}

async function listAll(client, bucket, prefix = '') {
  const out = []
  let offset = 0
  const limit = 100
  for (;;) {
    const { data, error } = await client.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    const rows = data || []
    for (const row of rows) {
      const path = prefix ? `${prefix}/${row.name}` : row.name
      if (row.id == null && row.metadata == null) {
        // klasör gibi davran
        out.push(...(await listAll(client, bucket, path)))
      } else {
        out.push(path)
      }
    }
    if (rows.length < limit) break
    offset += limit
  }
  return out
}

async function main() {
  for (const bucket of BUCKETS) {
    console.log(`\nBucket: ${bucket.id}`)
    if (!dry) await ensureBucket(target, bucket)
    let paths = []
    try {
      paths = await listAll(source, bucket.id)
    } catch (e) {
      console.warn(`  kaynak listelenemedi: ${e.message}`)
      continue
    }
    console.log(`  dosya: ${paths.length}${dry ? ' (dry-run)' : ''}`)
    for (const path of paths) {
      if (dry) {
        console.log(`  · ${path}`)
        continue
      }
      const { data: blob, error: dlErr } = await source.storage.from(bucket.id).download(path)
      if (dlErr) {
        console.error(`  ✗ download ${path}: ${dlErr.message}`)
        continue
      }
      const { error: upErr } = await target.storage.from(bucket.id).upload(path, blob, {
        upsert: true,
        contentType: blob.type || undefined,
      })
      if (upErr) console.error(`  ✗ upload ${path}: ${upErr.message}`)
      else console.log(`  ✓ ${path}`)
    }
  }
  console.log('\nTamamlandı.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
