export const PASSWORD_RULES = [
  { test: (v) => v.length >= 8, label: 'En az 8 karakter' },
  { test: (v) => /[a-z]/.test(v), label: 'Bir küçük harf (a-z)' },
  { test: (v) => /[A-Z]/.test(v), label: 'Bir büyük harf (A-Z)' },
  { test: (v) => /\d/.test(v), label: 'Bir rakam (0-9)' },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: 'Bir özel karakter (!@#$...)' },
]

export function isPasswordValid(v) {
  return PASSWORD_RULES.every((r) => r.test(v || ''))
}
