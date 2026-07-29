---
name: yeniform-membership-payments
description: >-
  Handles Yeni Form membership plans, entitlements, Stripe web checkout, and
  mobile IAP via RevenueCat. Use when working on paket, üyelik, plan kilidi,
  entitlement, Stripe, IAP, RevenueCat, premium expiry, or payment webhooks.
---

# Yeni Form Membership & Payments

## Locked model

- **Mobile digital subs:** App Store / Play via **RevenueCat** (IAP required).
- **Web:** Stripe Checkout — recurring planlar **Subscription** (`mode: subscription`, 1/3/6 ay `interval_count`); `doktor` one-shot `payment`. Webhook: `checkout.session.completed` + `invoice.paid` (yenileme) + `customer.subscription.deleted`. Portal: `action: 'create-portal-session'`.
- **Source of truth:** Supabase `members.membership`, `membership_status`, `stripe_customer_id`, `data.stripeSubscriptionId`, package/expiry in `members.data`.
- **Plan catalog (DB):** `public.plans` — marketing + `is_sellable` + `billing_type` + `entitlements` jsonb + `emoji`/`icon`/`color`. Admin CRUD: `/admin/plans`.
- **Paketsiz üye:** `membership === 'free'` → mesajlar/program/takvim/kütüphane/kalori `UnpaidMemberGate`. Profil + `/membership` + `/health-test` açık.
- **48s deneme (yalnızca yeni ücretsiz kayıt):** `freeTrialExpiresAt = now+48h` (`FREE_TRIAL_MS`). Aktifken dashboard + skorlar açık (`canAccessMemberDashboard`); HT tamamlanınca AI 1×. Süre bitince dashboard da gate. Süresi bitmiş ücretli → yeni deneme yok (`freeTrialExpiresAt` temizlenir).
- **Ücretsiz kayıt:** onboarding Step 0 → `register(profile, 'free')` / OAuth `completeOAuthMember(..., 'free')`. İsteğe bağlı “Paketle başla” → Stripe.

## Plan IDs

**Seed / fallback satılan:** `eko_diyet` | `diyet` | `eko_spor` | `spor` | `doktor` | `vip` (`SELLABLE_PLAN_IDS` — yalnızca JS fallback)  
**Runtime satış:** `plans.is_active && plans.is_sellable` (admin yeni ID ekleyebilir)  
**Fallback:** `free` (süresi bitmiş)  
**Eski (yeni satış yok):** `eko` — mevcut üyeler admin ile taşınır  

Durations: 1 / 3 / 6 months (`billing_type === 'one_time'` için tek seferlik). Ücretsiz kayıt açık; ücretli yol Stripe (DB’den fiyat + uygunluk).

Sıra: `sort_order` (seed: Eko Diyet(0) → … → Vip(5)).

## Entitlements (DB)

`plans.entitlements` jsonb:

```json
{
  "coachMeetingsPerMonth": 0,
  "dietitianMeetingsPerMonth": 0,
  "doctorMeetingsPerMonth": 0,
  "doctorSessionsTotal": 0,
  "photoCalorie": false,
  "manualCalorie": false,
  "fullVideo": false
}
```

`getDefaultPackageForPlan` / Stripe webhook `packageConfig` snapshot bu alanlardan üretilir. Kota değişikliği **yeni** atama/ödemeyi etkiler.

## Gate helpers (parity with web)

From `src/data/membershipPlans.js` (+ `setPlanCatalog` hydrate sonrası):

- `isFreeTrialActive` / `canAccessMemberDashboard` / `FREE_TRIAL_MS`
- `hasManualCalorieAccess` / `hasPhotoCalorieAccess` / `hasFullVideoAccess` — DB entitlements, legacy set fallback
- `getDefaultPackageForPlan(planId, months, planRow?)`
- `sortPlansForDisplay` — `isSellable` + `sortOrder`
- Server: `api/_planEntitlements.js`, `api/_memberEntitlements.js`

## Admin

- `/admin/plans` — oluştur / düzenle / soft-delete (pasif) / hard-delete (üye yoksa); emoji, renk, kota, bayraklar, `is_sellable`
- `/admin/premium` — atama listesi `getAdminAssignablePlanIds(plans)`
- `npm run db:migrate` admin marketing alanlarını **ezmez** (yoksa insert / boş entitlements doldur)

## When coding or documenting

1. Never unlock paid features client-only; server/RLS + membership row must agree.
2. Stripe checkout: DB `is_sellable` + fiyat; yeni plan ID’leri kod deploy gerektirmez.
3. New webhook: RevenueCat → update same fields as Stripe webhook.
4. Expiry → downgrade to `free` (`api/_membershipExpiry.js` / `syncMemberPackages`).

## Related

[reference.md](reference.md) · Supabase skill for RLS
