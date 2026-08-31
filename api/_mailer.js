/**
 * Transactional e-posta — Resend REST API (SDK yok).
 * Env: RESEND_API_KEY, MAIL_FROM (örn. "Yeni Form <info@yeniform.com>")
 */
import { getAppUrl } from './_appUrl.js'

const RESEND_API = 'https://api.resend.com/emails'
const DEFAULT_FROM = 'Yeni Form <info@yeniform.com>'

export function isMailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim())
}

export function getMailFrom() {
  return String(process.env.MAIL_FROM || DEFAULT_FROM).trim() || DEFAULT_FROM
}

function extractEmailAddress(from) {
  const raw = String(from || '').trim()
  const angled = raw.match(/<([^>]+)>/)
  const email = (angled ? angled[1] : raw).trim().toLowerCase()
  return email.includes('@') ? email : ''
}

export function getMailReplyTo() {
  return extractEmailAddress(getMailFrom()) || 'info@yeniform.com'
}

/**
 * @param {{ to: string|string[], subject: string, html: string, text?: string, replyTo?: string }} opts
 * @returns {Promise<{ ok: true, id?: string } | { ok: false, error: string, skipped?: boolean }>}
 */
export async function sendMail({ to, subject, html, text, replyTo }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  if (!apiKey) {
    return { ok: false, skipped: true, error: 'RESEND_API_KEY tanımlı değil.' }
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map((e) => String(e || '').trim().toLowerCase())
    .filter((e) => e.includes('@'))
  if (!recipients.length) {
    return { ok: false, error: 'Alıcı e-posta gerekli.' }
  }
  if (!subject || !html) {
    return { ok: false, error: 'Konu ve HTML gövde gerekli.' }
  }

  const body = {
    from: getMailFrom(),
    to: recipients,
    subject: String(subject).slice(0, 200),
    html,
    reply_to: extractEmailAddress(replyTo) || getMailReplyTo(),
  }
  if (text) body.text = String(text)

  try {
    const res = await fetch(RESEND_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = json?.message || json?.error || `Resend HTTP ${res.status}`
      return { ok: false, error: String(msg) }
    }
    return { ok: true, id: json?.id || null }
  } catch (e) {
    return { ok: false, error: String(e?.message || e) }
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(escaped) {
  return String(escaped || '').replace(/\r\n|\r|\n/g, '<br />')
}

function wrapBrandEmail({ title, bodyHtml, footerNote }) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f0e8;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8dfd0;">
        <tr><td style="height:6px;background:linear-gradient(90deg,#2d6a4f,#40916c,#52b788);"></td></tr>
        <tr><td style="padding:32px 28px 8px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2d6a4f;letter-spacing:0.04em;text-transform:uppercase;">Yeni Form</p>
          <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#1b4332;">${escapeHtml(title)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 28px 28px;border-top:1px solid #f0ebe3;">
          <p style="margin:0;font-size:12px;color:#888;text-align:center;">
            ${escapeHtml(footerNote || 'Yeni Form · yeniform.com')}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Personel başvurusu onaylandı — geçici şifre ile giriş bilgileri.
 */
export function staffApprovedEmail({ name, email, tempPassword, loginUrl }) {
  const safeName = escapeHtml(name || 'Merhaba')
  const safeEmail = escapeHtml(email)
  const safePwd = escapeHtml(tempPassword)
  const url = loginUrl || `${getAppUrl()}/login`
  const title = 'Başvurunuz onaylandı'
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, kadro başvurunuz onaylandı. Personel panelinize aşağıdaki bilgilerle giriş yapabilirsiniz.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 20px;background:#f6faf7;border-radius:12px;border:1px solid #d8ebe0;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#1b4332;">
        <strong>E-posta:</strong> ${safeEmail}<br />
        <strong>Geçici şifre:</strong> <code style="font-size:15px;background:#fff;padding:2px 8px;border-radius:6px;border:1px solid #cfe3d6;">${safePwd}</code>
      </td></tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      İlk girişte şifrenizi değiştirmeniz istenecektir. Bu e-postayı kimseyle paylaşmayın.
    </p>
    <p style="margin:0 0 8px;text-align:center;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Giriş Yap
      </a>
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    'Kadro başvurunuz onaylandı.',
    `E-posta: ${email}`,
    `Geçici şifre: ${tempPassword}`,
    '',
    'İlk girişte şifrenizi değiştirmeniz istenecektir.',
    `Giriş: ${url}`,
  ].join('\n')

  return {
    subject: 'Yeni Form — Başvurunuz onaylandı',
    html: wrapBrandEmail({ title, bodyHtml }),
    text,
  }
}

/**
 * Influencer hesabı oluşturuldu — geçici şifre ve kod.
 */
export function influencerInviteEmail({ name, email, tempPassword, code, loginUrl }) {
  const safeName = escapeHtml(name || 'Merhaba')
  const safeEmail = escapeHtml(email)
  const safePwd = escapeHtml(tempPassword || '')
  const safeCode = escapeHtml(code || '')
  const url = loginUrl || `${getAppUrl()}/login`
  const title = 'Influencer paneliniz hazır'
  const pwdBlock = tempPassword
    ? `<strong>Geçici şifre:</strong> <code style="font-size:15px;background:#fff;padding:2px 8px;border-radius:6px;border:1px solid #cfe3d6;">${safePwd}</code><br />`
    : ''
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, Yeni Form influencer paneliniz oluşturuldu. İndirim kodunuz ve giriş bilgileriniz aşağıdadır.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;margin:0 0 20px;background:#f6faf7;border-radius:12px;border:1px solid #d8ebe0;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#1b4332;">
        <strong>E-posta:</strong> ${safeEmail}<br />
        ${pwdBlock}
        <strong>İndirim kodunuz:</strong> <code style="font-size:15px;background:#fff;padding:2px 8px;border-radius:6px;border:1px solid #cfe3d6;">${safeCode}</code>
      </td></tr>
    </table>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      Kodunuzla paket alan müşteriler yüzde 10 indirim alır. İlk girişte şifrenizi değiştirmeniz istenecektir.
    </p>
    <p style="margin:0 0 8px;text-align:center;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Panele Giriş
      </a>
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    'Yeni Form influencer paneliniz hazır.',
    `E-posta: ${email}`,
    tempPassword ? `Geçici şifre: ${tempPassword}` : '',
    `İndirim kodu: ${code}`,
    '',
    'İlk girişte şifrenizi değiştirmeniz istenecektir.',
    `Giriş: ${url}`,
  ].filter((line, i, arr) => line !== '' || arr[i - 1] !== '').join('\n')

  return {
    subject: 'Yeni Form — Influencer paneliniz',
    html: wrapBrandEmail({ title, bodyHtml }),
    text,
  }
}

/**
 * Personel başvurusu reddedildi.
 */
export function staffRejectedEmail({ name, note }) {
  const safeName = escapeHtml(name || 'Merhaba')
  const noteBlock = note
    ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#4a4a4a;background:#faf6f0;border-radius:12px;padding:14px 16px;border:1px solid #ebe3d6;">
         <strong>Not:</strong> ${escapeHtml(note)}
       </p>`
    : ''
  const title = 'Başvuru sonucu'
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, kadro başvurunuz bu aşamada onaylanmadı.
    </p>
    ${noteBlock}
    <p style="margin:0;font-size:14px;line-height:1.6;color:#6b6b6b;">
      İleride yeni fırsatlar için tekrar başvurabilirsiniz. Sorularınız için info@yeniform.com adresine yazabilirsiniz.
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    'Kadro başvurunuz bu aşamada onaylanmadı.',
    note ? `Not: ${note}` : '',
    '',
    'Sorularınız için: info@yeniform.com',
  ].filter(Boolean).join('\n')

  return {
    subject: 'Yeni Form — Başvuru sonucu',
    html: wrapBrandEmail({ title, bodyHtml }),
    text,
  }
}

/**
 * Katalog fiyat değişimi — sonraki çekim (dönem içi ek tahsilat yok).
 */
export function catalogPriceChangeEmail({
  name,
  planName,
  amountLabel,
  dateLabel,
  paymentsUrl,
  cancelAtPeriodEnd = false,
  daysUntil = null,
}) {
  const safeName = escapeHtml(name || 'Merhaba')
  const safePlan = escapeHtml(planName || 'Paketiniz')
  const safeAmount = escapeHtml(amountLabel)
  const safeDate = escapeHtml(dateLabel)
  const url = paymentsUrl || `${getAppUrl()}/profile/payments`
  const soon = Number.isFinite(Number(daysUntil)) && Number(daysUntil) <= 7 && Number(daysUntil) >= 0
  const title = 'Abonelik ücretiniz güncellendi'
  const chargeLine = cancelAtPeriodEnd
    ? `Yenilemeniz kapalı; ${safeDate} tarihinde çekim yapılmaz. Yenilemeyi açarsanız sonraki dönem ${safeAmount} olarak faturalanır.`
    : soon
      ? `${safePlan} için sonraki çekim ${safeDate} (${Number(daysUntil)} gün içinde) · ${safeAmount}. Dönem içinde ek tahsilat yoktur.`
      : `${safePlan} için sonraki çekim ${safeDate} tarihinde ${safeAmount} olacaktır. Dönem içinde ek tahsilat yoktur.`
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, paket fiyatımız güncellendi.
    </p>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      ${chargeLine}
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      Devam etmek istemiyorsanız Ödeme Yönetimi’nden otomatik yenilemeyi kapatabilirsiniz. Mevcut dönem sonuna kadar erişiminiz sürer.
    </p>
    <p style="margin:0 0 8px;text-align:center;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Ödeme Yönetimi
      </a>
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    cancelAtPeriodEnd
      ? `${planName}: yenileme kapalı. Açarsanız sonraki dönem ${amountLabel}.`
      : `${planName}: sonraki çekim ${dateLabel} · ${amountLabel}. Dönem içinde ek tahsilat yok.`,
    '',
    `Yönetim: ${url}`,
  ].join('\n')

  return {
    subject: `Yeni Form — ${planName || 'Paket'} ücreti güncellendi`,
    html: wrapBrandEmail({ title, bodyHtml }),
    text,
  }
}

/** Çekimden 7 gün önce hatırlatma. */
export function catalogPriceReminderEmail({
  name,
  planName,
  amountLabel,
  dateLabel,
  paymentsUrl,
}) {
  const safeName = escapeHtml(name || 'Merhaba')
  const safePlan = escapeHtml(planName || 'Paketiniz')
  const safeAmount = escapeHtml(amountLabel)
  const safeDate = escapeHtml(dateLabel)
  const url = paymentsUrl || `${getAppUrl()}/profile/payments`
  const title = 'Yaklaşan üyelik yenilemesi'
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, ${safePlan} aboneliğiniz ${safeDate} tarihinde ${safeAmount} olarak yenilenecek.
    </p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#6b6b6b;">
      İstemiyorsanız Ödeme Yönetimi’nden yenilemeyi kapatın; dönem sonuna kadar erişiminiz açık kalır.
    </p>
    <p style="margin:0 0 8px;text-align:center;">
      <a href="${escapeHtml(url)}" style="display:inline-block;padding:14px 28px;background:#2d6a4f;color:#ffffff;text-decoration:none;border-radius:12px;font-size:15px;font-weight:600;">
        Ödeme Yönetimi
      </a>
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    `${planName} aboneliğiniz ${dateLabel} tarihinde ${amountLabel} olarak yenilenecek.`,
    '',
    `Yönetim: ${url}`,
  ].join('\n')

  return {
    subject: `Yeni Form — ${planName || 'Paket'} yenileme hatırlatması`,
    html: wrapBrandEmail({ title, bodyHtml }),
    text,
  }
}

const CONTACT_SUBJECT_LABELS = {
  general: 'Genel bilgi',
  membership: 'Üyelik & kayıt',
  premium: 'Premium paket',
  support: 'Teknik destek',
  partnership: 'İş birliği',
  other: 'Diğer',
}

/**
 * Bize Ulaşın formuna admin yanıtı — alıcı, formdaki e-posta.
 */
export function contactReplyEmail({
  name,
  replyBody,
  originalMessage,
  originalSubject,
  originalDateLabel,
}) {
  const safeName = escapeHtml(name || 'Merhaba')
  const subjectLabel = CONTACT_SUBJECT_LABELS[originalSubject] || originalSubject || 'Genel bilgi'
  const title = 'Talebinize yanıt'
  const quote = originalMessage
    ? `<p style="margin:20px 0 8px;font-size:12px;font-weight:600;color:#888;letter-spacing:0.03em;text-transform:uppercase;">Orijinal mesajınız</p>
       <div style="margin:0;padding:14px 16px;background:#f6faf7;border-radius:12px;border:1px solid #d8ebe0;font-size:13px;line-height:1.65;color:#5a6b62;">
         <p style="margin:0 0 6px;font-size:12px;color:#7a8c82;">${escapeHtml(subjectLabel)}${originalDateLabel ? ` · ${escapeHtml(originalDateLabel)}` : ''}</p>
         ${nl2br(escapeHtml(String(originalMessage).slice(0, 1500)))}
       </div>`
    : ''
  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#4a4a4a;">
      Merhaba ${safeName}, iletişim formunuz üzerinden bize ulaştığınız için teşekkürler. Yanıtımız aşağıdadır.
    </p>
    <div style="margin:0 0 8px;padding:16px 18px;background:#faf8f4;border-radius:12px;border:1px solid #ebe3d6;font-size:15px;line-height:1.7;color:#1b4332;">
      ${nl2br(escapeHtml(replyBody))}
    </div>
    ${quote}
    <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#6b6b6b;">
      Bu e-postayı yanıtlayarak bize yazmaya devam edebilirsiniz.
    </p>`
  const text = [
    `Merhaba ${name || ''},`,
    '',
    'İletişim formunuz üzerinden bize ulaştığınız için teşekkürler. Yanıtımız:',
    '',
    String(replyBody || ''),
    '',
    originalMessage ? '--- Orijinal mesajınız ---' : '',
    originalMessage ? String(originalMessage).slice(0, 1500) : '',
    '',
    'Bu e-postayı yanıtlayarak bize yazmaya devam edebilirsiniz.',
  ].filter((line, i, arr) => line !== '' || arr[i - 1] !== '').join('\n')

  return {
    subject: `Yeni Form — ${subjectLabel} talebinize yanıt`,
    html: wrapBrandEmail({
      title,
      bodyHtml,
      footerNote: 'Yeni Form · yeniform.com · info@yeniform.com',
    }),
    text,
  }
}
