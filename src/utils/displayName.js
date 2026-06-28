export function firstNameFrom(fullName) {
  const part = String(fullName || '').trim().split(/\s+/)[0]
  return part || null
}

/** Görünen ad — isim, e-posta öneki veya rol bazlı yedek */
export function resolveFirstName({ name, email, fallback = 'Üye' } = {}) {
  return firstNameFrom(name) || firstNameFrom(email?.split('@')[0]) || fallback
}
