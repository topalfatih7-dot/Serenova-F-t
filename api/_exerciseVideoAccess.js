import { getAdminEmail } from './_guards.js'
import { isPaidMembership } from './_memberPackages.js'

export function isExerciseVideoStoragePath(path) {
  return typeof path === 'string' && /^[\w.-]+$/.test(path) && !path.includes('..')
}

export function programGrantsFullLibrary(programData = {}) {
  return programData?.source === 'library_catalog' || programData?.fullLibraryAccess === true
}

export function programIncludesExerciseId(programData = {}, exerciseId) {
  const id = String(exerciseId || '')
  if (!id) return false
  const entries = Array.isArray(programData?.entries) ? programData.entries : []
  return entries.some((entry) => String(entry?.exerciseId || '') === id)
}

/**
 * Private bucket imzası — üye yalnızca kendi programındaki (veya tam kütüphane hakkı olan)
 * videoyu alır. Personel / admin tam erişim. Ücretsiz üye hayır.
 */
export async function assertExerciseVideoAccess(admin, user, path) {
  if (!isExerciseVideoStoragePath(path)) {
    return { ok: false, status: 400, error: 'Geçersiz video yolu' }
  }
  if (!user?.id) {
    return { ok: false, status: 401, error: 'Oturum bulunamadı.' }
  }

  const email = String(user.email || '').toLowerCase()
  if (email && email === getAdminEmail()) return { ok: true }

  const { data: member } = await admin
    .from('members')
    .select('id, role, membership, data')
    .eq('id', user.id)
    .maybeSingle()
  if (member?.role === 'admin') return { ok: true }

  const { data: staff } = await admin
    .from('staff')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()
  if (staff?.id) return { ok: true }

  if (!member || !isPaidMembership(member.membership)) {
    return { ok: false, status: 403, error: 'Video için aktif paket gerekli.' }
  }
  if (member.data?.fullLibraryAccess === true) return { ok: true }

  const { data: programs } = await admin
    .from('programs')
    .select('data')
    .eq('member_id', user.id)
  const rows = programs || []
  if (rows.some((row) => programGrantsFullLibrary(row.data || {}))) return { ok: true }

  const { data: exercise } = await admin
    .from('exercises')
    .select('id')
    .eq('video_url', path)
    .maybeSingle()
  if (!exercise?.id) {
    return { ok: false, status: 403, error: 'Bu video programınızda yok.' }
  }
  if (rows.some((row) => programIncludesExerciseId(row.data || {}, exercise.id))) {
    return { ok: true }
  }
  return { ok: false, status: 403, error: 'Bu video programınızda yok.' }
}
