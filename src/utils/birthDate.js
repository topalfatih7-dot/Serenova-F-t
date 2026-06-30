/** Doğum tarihinden yaş hesaplar (bugünkü tarihe göre). */
export function ageFromBirthDate(birthDate) {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

/** Profil gösterimi için Türkçe tarih biçimi. */
export function formatBirthDate(birthDate) {
  if (!birthDate) return '—'
  const d = new Date(birthDate)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function birthDateError(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return 'Geçerli bir tarih girin'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (d > today) return 'Gelecek tarih olamaz'
  const age = ageFromBirthDate(value)
  if (age == null || age < 13) return 'En az 13 yaşında olmalısınız'
  if (age > 100) return 'Geçerli bir doğum tarihi girin'
  return ''
}
