/**
 * Auth kullanıcılarını kaynak Supabase → hedef Supabase kopyalar.
 *
 * Env:
 *   SOURCE_SUPABASE_URL, SOURCE_SUPABASE_SERVICE_ROLE_KEY
 *   TARGET_SUPABASE_URL, TARGET_SUPABASE_SERVICE_ROLE_KEY
 *
 * Not: GoTrue şifre hash'i Admin API ile taşınmaz. createUser password olmadan
 * yapılır; kullanıcılar "şifremi unuttum" ile devam eder (küçük tabanda kabul).
 * Email confirm / metadata kopyalanır.
 *
 * Kullanım: node scripts/migrate-auth-users.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'

const dry = process.argv.includes('--dry-run')

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

async function listAllUsers(client) {
  const users = []
  let page = 1
  for (;;) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    const batch = data?.users || []
    users.push(...batch)
    if (batch.length < 200) break
    page += 1
  }
  return users
}

async function main() {
  const users = await listAllUsers(source)
  console.log(`Kaynak kullanıcı: ${users.length}${dry ? ' (dry-run)' : ''}`)

  let ok = 0
  let skip = 0
  let fail = 0

  for (const u of users) {
    const email = (u.email || '').toLowerCase()
    if (!email) {
      skip += 1
      continue
    }
    if (dry) {
      console.log(`  · ${email} id=${u.id}`)
      ok += 1
      continue
    }
    const { data: existing } = await target.auth.admin.listUsers({ page: 1, perPage: 1 })
    void existing
    const { error } = await target.auth.admin.createUser({
      id: u.id,
      email,
      email_confirm: Boolean(u.email_confirmed_at),
      phone: u.phone || undefined,
      phone_confirm: Boolean(u.phone_confirmed_at),
      user_metadata: u.user_metadata || {},
      app_metadata: {
        ...(u.app_metadata || {}),
        active_session_id: null,
        active_session_at: null,
        migrated_from: 'ap-south-1',
      },
    })
    if (error) {
      if (/already|exists|registered/i.test(error.message)) {
        skip += 1
        console.log(`  ~ atlandı (var): ${email}`)
      } else {
        fail += 1
        console.error(`  ✗ ${email}: ${error.message}`)
      }
    } else {
      ok += 1
      console.log(`  ✓ ${email}`)
    }
  }

  console.log(`Bitti: ok=${ok} skip=${skip} fail=${fail}`)
  if (fail) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
