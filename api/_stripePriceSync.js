/**
 * Admin / cron: katalog Price üret, mevcut abonelik item’larını proration none ile hizala, bildir.
 */
import { toMinorUnits, stripeObjectId } from './_stripe.js'
import { ensureCatalogPrice } from './_stripeCatalog.js'
import { notifyCatalogPriceChange, applyNoticeResult } from './_stripePriceNotify.js'
import {
  catalogTiersFromPlan,
  LIVE_SUBSCRIPTION_STATUSES,
  primarySubscriptionItem,
  subscriptionUnitAmount,
  subscriptionIntervalCount,
  shouldNotifyAmountChange,
  stripeSearchLiteral,
  collectMemberStripeSubscriptionRefs,
  CATALOG_PRORATION,
} from '../src/utils/stripeCatalog.js'
import { tierPriceFromPlan, invalidatePlanCache } from './_planEntitlements.js'

export const MAX_SYNC_UPDATES = 25

function planFromRow(row) {
  if (!row) return null
  if (row.pricingTiers || row.billingType) return row
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    billingType: row.billing_type === 'one_time' ? 'one_time' : 'recurring',
    pricingTiers: row.pricing_tiers || row.pricingTiers || [],
  }
}

async function searchSubscriptionsForPlan(stripe, planId) {
  const out = []
  const statuses = [...LIVE_SUBSCRIPTION_STATUSES]
  const planLit = stripeSearchLiteral(planId)
  for (const status of statuses) {
    const query = `metadata["planId"]:"${planLit}" AND status:"${status}"`
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
      console.warn('[stripe-price-sync] search', planId, status, e.message)
    }
  }
  return out
}

async function memberRefsForPlanTier(admin, planId, months) {
  const { data, error } = await admin
    .from('members')
    .select('id, email, name, membership, stripe_customer_id, data')
    .not('stripe_customer_id', 'is', null)
    .limit(2000)
  if (error) {
    console.warn('[stripe-price-sync] members', error.message)
    return []
  }
  const refs = []
  for (const row of data || []) {
    for (const ref of collectMemberStripeSubscriptionRefs(row)) {
      if (ref.planId !== planId) continue
      if (Number(ref.durationMonths) !== Number(months)) continue
      refs.push({ ...ref, memberId: row.id, email: row.email, name: row.name, row })
    }
  }
  return refs
}

async function findMemberForSub(admin, subscription, hint = null) {
  if (hint?.row) return hint.row
  const memberId = String(subscription?.metadata?.memberId || hint?.memberId || '').trim()
  if (memberId) {
    const { data } = await admin
      .from('members')
      .select('id, email, name, membership, stripe_customer_id, data')
      .eq('id', memberId)
      .maybeSingle()
    if (data) return data
  }
  const customerId = stripeObjectId(subscription?.customer)
  if (customerId) {
    const { data } = await admin
      .from('members')
      .select('id, email, name, membership, stripe_customer_id, data')
      .eq('stripe_customer_id', customerId)
      .maybeSingle()
    if (data) return data
  }
  return null
}

async function persistMemberData(admin, row, data) {
  return admin
    .from('members')
    .update({ data, updated_at: new Date().toISOString() })
    .eq('id', row.id)
}

async function alignSubscription(stripe, subscription, catalogPrice, {
  planId,
  planPrice,
  months,
}) {
  const item = primarySubscriptionItem(subscription)
  if (!item?.id) {
    return { ok: false, error: 'Abonelik kalemi yok' }
  }
  const currentAmount = subscriptionUnitAmount(subscription)
  const nextAmount = Number(catalogPrice.unit_amount) || 0
  if (currentAmount === nextAmount && String(item.price?.id || item.price) === catalogPrice.id) {
    return { ok: true, skipped: true, previousAmount: currentAmount / 100, nextAmount: nextAmount / 100 }
  }
  if (currentAmount === nextAmount) {
    return { ok: true, skipped: true, previousAmount: currentAmount / 100, nextAmount: nextAmount / 100 }
  }

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: catalogPrice.id }],
    proration_behavior: CATALOG_PRORATION,
    metadata: {
      ...(subscription.metadata || {}),
      planId: String(planId),
      planPrice: String(planPrice),
      durationMonths: String(months),
    },
  })
  return {
    ok: true,
    skipped: false,
    previousAmount: currentAmount / 100,
    nextAmount: nextAmount / 100,
    subscription: updated,
  }
}

/**
 * Bir planın tüm sürelerini katalog Price’a bağlar ve eşleşen abonelikleri hizalar.
 */
export async function syncPlanCatalogToSubscriptions(stripe, admin, {
  plan,
  maxUpdates = MAX_SYNC_UPDATES,
  notify = true,
} = {}) {
  const mapped = planFromRow(plan)
  if (!mapped?.id) return { ok: false, error: 'Plan yok' }
  invalidatePlanCache()

  const oneTime = mapped.billingType === 'one_time' || mapped.id === 'doktor'
  const tiers = catalogTiersFromPlan(mapped)
  const prices = []
  const errors = []
  let updated = 0
  let skipped = 0
  let notified = 0
  let remaining = 0

  for (const tier of tiers) {
    try {
      const catalogPrice = await ensureCatalogPrice(stripe, {
        planId: mapped.id,
        planName: mapped.name,
        months: tier.months,
        amountTry: tier.price,
        oneTime: oneTime || tier.oneTime,
      })
      prices.push({ months: tier.months, priceId: catalogPrice.id, amount: tier.price })
      if (oneTime || tier.oneTime) continue

      const searched = await searchSubscriptionsForPlan(stripe, mapped.id)
      const fromSearch = searched.filter((sub) => (
        LIVE_SUBSCRIPTION_STATUSES.has(sub.status)
        && Number(subscriptionIntervalCount(sub)) === Number(tier.months)
      ))
      const fromMembers = await memberRefsForPlanTier(admin, mapped.id, tier.months)
      const byId = new Map()
      for (const sub of fromSearch) byId.set(sub.id, { subscription: sub, hint: null })
      for (const ref of fromMembers) {
        if (byId.has(ref.subscriptionId)) {
          byId.get(ref.subscriptionId).hint = ref
          continue
        }
        try {
          const sub = await stripe.subscriptions.retrieve(ref.subscriptionId, {
            expand: ['items.data.price'],
          })
          byId.set(sub.id, { subscription: sub, hint: ref })
        } catch (e) {
          errors.push({ subscriptionId: ref.subscriptionId, error: e.message })
        }
      }

      for (const { subscription, hint } of byId.values()) {
        if (!LIVE_SUBSCRIPTION_STATUSES.has(subscription.status)) {
          skipped += 1
          continue
        }
        if (Number(subscriptionIntervalCount(subscription)) !== Number(tier.months)) {
          skipped += 1
          continue
        }
        const prev = subscriptionUnitAmount(subscription)
        const next = toMinorUnits(tier.price)
        if (!shouldNotifyAmountChange(prev / 100, tier.price) && prev === next) {
          skipped += 1
          continue
        }
        if (updated >= maxUpdates) {
          remaining += 1
          continue
        }
        let result
        try {
          result = await alignSubscription(stripe, subscription, catalogPrice, {
            planId: mapped.id,
            planPrice: tier.price,
            months: tier.months,
          })
        } catch (e) {
          errors.push({ subscriptionId: subscription.id, error: e.message })
          continue
        }
        if (!result.ok) {
          errors.push({ subscriptionId: subscription.id, error: result.error })
          continue
        }
        if (result.skipped) {
          skipped += 1
          continue
        }
        updated += 1
        if (!notify) continue

        const member = await findMemberForSub(admin, result.subscription || subscription, hint)
        if (!member) continue
        const periodEnd = (result.subscription || subscription).current_period_end
        const cancelAtPeriodEnd = Boolean((result.subscription || subscription).cancel_at_period_end)
        const sent = await notifyCatalogPriceChange(admin, {
          memberId: member.id,
          email: member.email,
          name: member.name,
          planName: mapped.name,
          amountTry: tier.price,
          periodEnd,
          cancelAtPeriodEnd,
        })
        const nextData = applyNoticeResult(member.data || {}, {
          subId: subscription.id,
          periodEnd,
          amount: tier.price,
          kind: 'zam',
          sent: sent.ok,
        })
        await persistMemberData(admin, member, nextData)
        if (sent.ok) notified += 1
      }
    } catch (e) {
      errors.push({ months: tier.months, error: e.message })
    }
  }

  return {
    ok: errors.length === 0 || updated > 0 || prices.length > 0,
    planId: mapped.id,
    prices,
    updated,
    skipped,
    notified,
    remaining,
    errors,
  }
}

export async function loadPlanRow(admin, planId) {
  const { data, error } = await admin.from('plans').select('*').eq('id', planId).maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

/** Cron güvenlik ağı: tüm recurring planları hizala (kota maxUpdates). */
export async function alignAllPlanCatalogs(stripe, admin, { maxUpdates = MAX_SYNC_UPDATES } = {}) {
  const { data: plans, error } = await admin.from('plans').select('*')
  if (error) throw new Error(error.message)
  const summaries = []
  let budget = maxUpdates
  for (const row of plans || []) {
    const plan = planFromRow(row)
    if (!plan || plan.id === 'free') continue
    if (plan.billingType === 'one_time') {
      try {
        await ensureCatalogPrice(stripe, {
          planId: plan.id,
          planName: plan.name,
          months: 1,
          amountTry: tierPriceFromPlan(plan, 1) || plan.price,
          oneTime: true,
        })
      } catch (e) {
        summaries.push({ planId: plan.id, ok: false, error: e.message })
      }
      continue
    }
    if (budget <= 0) {
      summaries.push({ planId: plan.id, ok: true, deferred: true })
      continue
    }
    const result = await syncPlanCatalogToSubscriptions(stripe, admin, {
      plan,
      maxUpdates: budget,
      notify: true,
    })
    budget -= Number(result.updated) || 0
    summaries.push(result)
  }
  return { ok: true, summaries, remainingBudget: budget }
}
