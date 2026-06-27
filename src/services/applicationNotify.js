/**
 * Başvuru Telegram bildirimleri — yalnızca iletişim bilgileri, ayrı chat'ler.
 */

async function postApplicationNotify(payload) {
  try {
    const headers = { 'Content-Type': 'application/json' }
    const secret = import.meta.env.VITE_TELEGRAM_NOTIFY_SECRET
    if (secret) headers['X-Notify-Secret'] = secret

    await fetch('/api/application-notify', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  } catch {
    // Bildirim hatası başvuru akışını kesmemeli
  }
}

export function notifyStaffApplicationTelegram({ name, email, phone, role, roleLabel }) {
  return postApplicationNotify({
    type: 'staff_application',
    name,
    email,
    phone,
    role,
    roleLabel,
  })
}

export function notifyCorporateApplicationTelegram({ companyName, contactName, email, phone }) {
  return postApplicationNotify({
    type: 'corporate_application',
    companyName,
    contactName,
    email,
    phone,
  })
}
