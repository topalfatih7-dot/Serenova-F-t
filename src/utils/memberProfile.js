const SOCIAL_PROVIDERS = ['google', 'apple', 'facebook']

/** Supabase oturumunun yalnızca sosyal sağlayıcı (Google/Apple/Facebook) ile açılıp açılmadığını döner. */
export function isSocialAuthUser(authUser) {
  if (!authUser) return false
  const identities = authUser.identities || []
  const providers = identities.map((i) => i.provider)
  const hasEmailIdentity = providers.includes('email')
  const hasSocialIdentity = providers.some((p) => SOCIAL_PROVIDERS.includes(p))

  if (hasSocialIdentity && !hasEmailIdentity) return true

  const primary = authUser.app_metadata?.provider
  if (primary && SOCIAL_PROVIDERS.includes(primary) && !hasEmailIdentity) return true

  return false
}

/**
 * OAuth ile giriş yapan ve profili eksik üyeler için true döner.
 * E-posta/şifre ile tam kayıt olmuş üyeler asla bu kontrole takılmaz.
 */
export function memberNeedsProfileCompletion(member, authUser = null) {
  if (!member?.id) return false
  if (member.profileComplete === true) return false

  // E-posta/şifre hesabı — kayıt akışından geçmiş kabul et (eski üyeler dahil)
  if (authUser && !isSocialAuthUser(authUser)) return false

  // Tamamlanmış kayıt: telefon ve ad mevcutsa yeterli (joinedAt eski kayıtlarda olmayabilir)
  if (member.phone?.trim() && member.name?.trim()) return false

  if (!isSocialAuthUser(authUser)) return false

  if (!member.phone?.trim()) return true
  if (!member.name?.trim()) return true
  if (!member.joinedAt) return true
  return false
}

export function displayNameFromAuthUser(user) {
  if (!user) return ''
  const meta = user.user_metadata || {}
  const fromMeta = meta.full_name || meta.name
  if (fromMeta?.trim()) return fromMeta.trim()
  const given = meta.given_name || ''
  const family = meta.family_name || ''
  const combined = `${given} ${family}`.trim()
  return combined
}
