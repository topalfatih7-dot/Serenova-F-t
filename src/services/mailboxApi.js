import { getApiAuthHeaders } from './apiAuth'

export async function mailboxRequest(op, payload = {}) {
  const headers = await getApiAuthHeaders()
  let res
  try {
    res = await fetch('/api/contact', {
      method: 'POST',
      headers,
      body: JSON.stringify({ action: 'admin_mailbox', op, ...payload }),
    })
  } catch (err) {
    const msg = String(err?.message || err)
    throw new Error(
      /failed to fetch/i.test(msg)
        ? 'Sunucuya bağlanılamadı. Sayfayı yenileyip tekrar deneyin.'
        : msg,
    )
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.ok === false) {
    const error = new Error(json.error || 'E-posta işlemi başarısız')
    error.status = res.status
    throw error
  }
  return json
}

export function fileToMailboxAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Dosya okunamadı'))
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const comma = dataUrl.indexOf(',')
      const dataBase64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
      resolve({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        dataBase64,
      })
    }
    reader.readAsDataURL(file)
  })
}
