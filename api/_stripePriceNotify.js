/**
 * Katalog fiyat bildirimi — e-posta + in-app + Expo push.
 */
import { getAppUrl } from './_appUrl.js'
import { sendMail, catalogPriceChangeEmail, catalogPriceReminderEmail } from './_mailer.js'
import { sendExpoPushToMember } from './_expoPush.js'
import {
  formatTryAmount,
  formatChargeDateTr,
  daysUntilPeriodEnd,
  recordPriceNotice,
  markNoticeSent,
} from '../src/utils/stripeCatalog.js'

const PAYMENTS_PATH = '/profile/payments'

function buildBillingNotification({ title, message }) {
  return {
    id: `n-billing-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: 'billing',
    title,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    action: 'payments',
  }
}

function paymentsUrl() {
  return `${getAppUrl()}${PAYMENTS_PATH}`
}

async function appendInApp(admin, memberId, notification) {
  const { error } = await admin.rpc('append_member_notification', {
    p_member_id: memberId,
    p_notification: notification,
  })
  if (error) return { ok: false, error: error.message }
  try {
    await sendExpoPushToMember(admin, memberId, notification)
  } catch (e) {
    console.warn('[stripe-price-notify] expo', memberId, e.message)
  }
  return { ok: true }
}

export async function notifyCatalogPriceChange(admin, {
  memberId,
  email,
  name,
  planName,
  amountTry,
  periodEnd,
  cancelAtPeriodEnd = false,
}) {
  const amountLabel = formatTryAmount(amountTry)
  const dateLabel = formatChargeDateTr(periodEnd)
  const daysUntil = daysUntilPeriodEnd(periodEnd)
  const title = 'Abonelik ücretiniz güncellendi'
  const message = cancelAtPeriodEnd
    ? `${planName}: yenileme kapalı. Açarsanız sonraki dönem ${amountLabel}.`
    : `${planName}: sonraki çekim ${dateLabel} · ${amountLabel}. Dönem içinde ek tahsilat yok.`

  const notification = buildBillingNotification({ title, message })
  const inApp = memberId ? await appendInApp(admin, memberId, notification) : { ok: true }

  const mail = catalogPriceChangeEmail({
    name,
    planName,
    amountLabel,
    dateLabel,
    paymentsUrl: paymentsUrl(),
    cancelAtPeriodEnd,
    daysUntil,
  })
  const emailed = email
    ? await sendMail({ to: email, ...mail })
    : { ok: true, skipped: true }

  return {
    ok: inApp.ok && (emailed.ok || emailed.skipped),
    inApp,
    emailed,
  }
}

export async function notifyCatalogPriceReminder(admin, {
  memberId,
  email,
  name,
  planName,
  amountTry,
  periodEnd,
}) {
  const amountLabel = formatTryAmount(amountTry)
  const dateLabel = formatChargeDateTr(periodEnd)
  const title = 'Yaklaşan üyelik yenilemesi'
  const message = `${planName} aboneliğiniz ${dateLabel} tarihinde ${amountLabel} olarak yenilenecek.`
  const notification = buildBillingNotification({ title, message })
  const inApp = memberId ? await appendInApp(admin, memberId, notification) : { ok: true }

  const mail = catalogPriceReminderEmail({
    name,
    planName,
    amountLabel,
    dateLabel,
    paymentsUrl: paymentsUrl(),
  })
  const emailed = email
    ? await sendMail({ to: email, ...mail })
    : { ok: true, skipped: true }

  return {
    ok: inApp.ok && (emailed.ok || emailed.skipped),
    inApp,
    emailed,
  }
}

export function applyNoticeResult(data, { subId, periodEnd, amount, kind, sent }) {
  const notices = Array.isArray(data?.priceNotices) ? data.priceNotices : []
  if (sent) {
    const cleared = markNoticeSent(notices, { subId, periodEnd, amount, kind })
    const already = cleared.some((n) => (
      n.subId === String(subId || '').trim()
      && n.kind === kind
      && n.status === 'sent'
      && Math.round(Number(n.amount) || 0) === Math.round(Number(amount) || 0)
    ))
    return {
      ...data,
      priceNotices: already
        ? cleared
        : recordPriceNotice(cleared, { subId, periodEnd, amount, kind, status: 'sent' }),
    }
  }
  return {
    ...data,
    priceNotices: recordPriceNotice(notices, { subId, periodEnd, amount, kind, status: 'pending' }),
  }
}
