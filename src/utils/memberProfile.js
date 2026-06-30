/** OAuth / yarım kalmış kayıtlarda eksik alan kontrolü */
export function memberNeedsProfileCompletion(member) {
  if (!member?.id) return false
  if (member.profileComplete === true) return false
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
