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

export function passwordRequirementsMessage() {
  return 'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.'
}

/** Supabase Auth / HIBP mesajlarını kullanıcıya gösterilecek Türkçe’ye çevirir. */
export function formatPasswordAuthError(raw) {
  const msg = String(raw || '')
  if (/known to be weak|easy to guess|pwned|leaked|hibp/i.test(msg)) {
    return passwordRequirementsMessage()
  }
  if (/weak.?password|password.?should|at least one character/i.test(msg)) {
    return passwordRequirementsMessage()
  }
  return msg
}
