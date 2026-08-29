import { getApiAuthHeaders } from './apiAuth'

export async function changeAccountPassword({ currentPassword, newPassword, confirmPassword }) {
  const headers = await getApiAuthHeaders()
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'password-change',
      currentPassword,
      newPassword,
      confirmPassword,
    }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || !json?.ok) {
    const error = new Error(json?.error || 'Şifre güncellenemedi.')
    error.code = json?.code
    error.status = res.status
    throw error
  }
  return json
}
