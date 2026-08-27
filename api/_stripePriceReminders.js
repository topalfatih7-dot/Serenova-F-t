/**
 * T-7 yenileme hatırlatması + bekleyen zam mailleri.
 */
import { stripeObjectId } from './_stripe.js'
import { loadPlansById, tierPriceFromPlan, isOneTimePlanId } from './_planEntitlements.js'
import { notifyCatalogPriceReminder, notifyCatalogPriceChange, applyNoticeResult } from './_stripePriceNotify.js'
import {
  shouldSendT7Reminder,
  pendingPriceNotices,
  LIVE_SUBSCRIPTION_STATUSES,
  subscriptionIntervalCount,
  PRICE_REMINDER_DAYS,
} from '../src/utils/stripeCatalog.js'

const MEMBER_COLS = 'id, email, name, membership, stripe_customer_id, data'

async function persistMemberData(admin, row, data) {
  return admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', row.id)
}

async function findMemberForSub(admin, subscription) {
  const memberId = String(subscription?.metadata?.memberId || '').trim()
  if (memberId) {
    const { data } = await admin.from('members').select(MEMBER_COLS).eq('id', memberId).maybeSingle()
    if (data) return data
  }
  const customerId = stripeObjectId(subscription?.customer)
  if (customerId) {
    const { data } = await admin
      .from('members')
      .select(MEMBER_COLS)
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

async function flushPendingNotices(admin, plansById) {
  const { data: rows, error } = await admin
    .from('members')
    .select(MEMBER_COLS)
    .not('stripe_customer_id', 'is', null)
    .limit(2000)
  if (error) throw new Error(error.message)

  let flushed = 0
  for (const row of rows || []) {
    const pending = pendingPriceNotices(row.data?.priceNotices)
    if (!pending.length) continue
    let data = row.data || {}
    for (const n of pending) {
      const plan = plansById.get(String(row.membership)) || null
      const planName = plan?.name || 'Paketiniz'
      const sent = await notifyCatalogPriceChange(admin, {
        memberId: row.id,
        email: row.email,
        name: row.name,
        planName,
        amountTry: n.amount,
        periodEnd: n.periodEnd,
        cancelAtPeriodEnd: false,
      })
      data = applyNoticeResult(data, {
        subId: n.subId,
        periodEnd: n.periodEnd,
        amount: n.amount,
        kind: n.kind || 'zam',
        sent: sent.ok,
      })
      if (sent.ok) flushed += 1
    }
    await persistMemberData(admin, row, data)
  }
  return flushed
}

async function searchUpcomingRenewals(stripe, nowSec, untilSec) {
  const out = []
  const statuses = ['active', 'trialing']
  for (const status of statuses) {
    const query = `status:"${status}" AND current_period_end>${nowSec} AND current_period_end<=${untilSec}`
    try {
      let page = await stripe.subscriptions.search({
        query,
        limit: 100,
        expand: ['data.items.data.price'],
      })
      out.push(...(page.data || []))
      while (page.has_more && page.next_page) {
        page = await stripe.subscriptions.search({
          query,
          limit: 100,
          page: page.next_page,
          expand: ['data.items.data.price'],
        })
        out.push(...(page.data || []))
      }
    } catch (e) {
      console.warn('[stripe-price-reminders] search', status, e.message)
    }
  }
  return out
}

export async function runCatalogPriceReminders(stripe, admin, { now = new Date() } = {}) {
  const plansById = await loadPlansById(admin)
  const flushed = await flushPendingNotices(admin, plansById)

  const nowSec = Math.floor(now.getTime() / 1000)
  const untilSec = nowSec + PRICE_REMINDER_DAYS * 24 * 60 * 60
  const subs = await searchUpcomingRenewals(stripe, nowSec, untilSec)

  let reminded = 0
  let skipped = 0
  const errors = []

  for (const subscription of subs) {
    if (!LIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
      skipped += 1
      continue
    }
    if (subscription.cancel_at_period_end) {
      skipped += 1
      continue
    }
    const planId = String(subscription.metadata?.planId || '').trim()
    if (!planId) {
      skipped += 1
      continue
    }
    const plan = plansById.get(planId)
    if (!plan || isOneTimePlanId(planId, plan)) {
      skipped += 1
      continue
    }
    const months = subscriptionIntervalCount(subscription)
    const amountTry = tierPriceFromPlan(plan, months)
    if (!amountTry) {
      skipped += 1
      continue
    }

    const member = await findMemberForSub(admin, subscription)
    if (!member) {
      skipped += 1
      continue
    }
    const notices = member.data?.priceNotices
    if (!shouldSendT7Reminder({
      cancelAtPeriodEnd: false,
      periodEnd: subscription.current_period_end,
      amount: amountTry,
      notices,
      subId: subscription.id,
      now,
    })) {
      skipped += 1
      continue
    }

    try {
      const sent = await notifyCatalogPriceReminder(admin, {
        memberId: member.id,
        email: member.email,
        name: member.name,
        planName: plan.name || planId,
        amountTry,
        periodEnd: subscription.current_period_end,
      })
      const nextData = applyNoticeResult(member.data || {}, {
        subId: subscription.id,
        periodEnd: subscription.current_period_end,
        amount: amountTry,
        kind: 'remind',
        sent: sent.ok,
      })
      await persistMemberData(admin, member, nextData)
      if (sent.ok) reminded += 1
    } catch (e) {
      errors.push({ subscriptionId: subscription.id, error: e.message })
    }
  }

  return { ok: true, flushed, reminded, skipped, errors }
}
