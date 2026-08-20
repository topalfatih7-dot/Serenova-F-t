---
name: yeniform-membership-payments
description: >-
  Handles Yeni Form membership plans, entitlements, and Stripe web checkout.
  Use when working on paket, üyelik, plan kilidi, entitlement, Stripe,
  premium expiry, or payment webhooks.
---

# Yeni Form Membership & Payments

## Locked model

- **Web:** Stripe Checkout — recurring planlar **Subscription** (`mode: subscription`, 1/3/6 ay `interval_count`); `doktor` one-shot `payment`. Webhook: `checkout.session.completed` + `invoice.paid` (yenileme) + `customer.subscription.updated` (dönem sonu iptal) + `customer.subscription.deleted` (hemen kapat / bitiş). Portal: `action: 'create-portal-session'` (`intent` manage/cancel).
- **Source of truth:** Supabase `members.membership`, `membership_status`, `stripe_customer_id`, `data.stripeSubscriptionId`, package/expiry in `members.data`.
- **Plan catalog (DB):** `public.plans` — marketing + `is_sellable` + `billing_type` + `entitlements` jsonb + `emoji`/`icon`/`color`. Admin CRUD: `/admin/plans`.
- **Freemium:** Ücretsiz kayıt + site gezintisi. `membership === 'free'` → mesajlar/program/takvim/kütüphane/kalori `UnpaidMemberGate`. Profil + `/membership` + `/health-test` açık. Süre bitmiş ücretli → `free` fallback.
- **Ücretsiz kayıt:** onboarding → `register(profile, 'free')` / OAuth `completeOAuthMember(..., 'free')`. İsteğe bağlı “Paketle başla” → Stripe.

## Plan IDs

**Seed / fallback satılan:** `eko_diyet` | `diyet` | `eko_spor` | `spor` | `doktor` | `vip` (`SELLABLE_PLAN_IDS`)  
**Runtime satış:** `plans.is_active && plans.is_sellable`  
**Fallback:** `free`  
**Eski (yeni satış yok):** `eko`

Durations: 1 / 3 / 6 months (`billing_type === 'one_time'` için tek seferlik).

## Entitlements (DB)

```json
{
  "coachMeetingsPerMonth": 0,
  "dietitianMeetingsPerMonth": 0,
  "doctorMeetingsPerMonth": 0,
  "doctorSessionsTotal": 0,
  "photoCalorie": false,
  "manualCalorie": false
}
```

Video erişimi program-scoped (üyenin kendi programındaki egzersizler); ayrı `fullVideo` bayrağı yok.

## Gate helpers

From `src/data/membershipPlans.js`:

- `canAccessMemberDashboard` / `hasManualCalorieAccess` / `hasPhotoCalorieAccess`
- `getDefaultPackageForPlan(planId, months, planRow?)`
- Server: `api/_planEntitlements.js`, `api/_memberEntitlements.js`

## When coding

1. Never unlock paid features client-only; server/RLS + membership row must agree.
2. Stripe checkout: DB `is_sellable` + fiyat.
3. Expiry → downgrade to `free` (`api/_membershipExpiry.js` / `syncMemberPackages`).

## Related

[reference.md](reference.md) · Supabase skill for RLS
