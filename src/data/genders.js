/** Üye kaydı ve profil — yalnızca Kadın / Erkek (belirtmek istemiyorum seçeneği yok). */
export const MEMBER_GENDERS = [
  { value: 'female', label: 'Kadın' },
  { value: 'male', label: 'Erkek' },
]

export const MEMBER_GENDER_LABELS = Object.fromEntries(
  MEMBER_GENDERS.map((g) => [g.value, g.label]),
)

export function isValidMemberGender(value) {
  return MEMBER_GENDERS.some((g) => g.value === value)
}
