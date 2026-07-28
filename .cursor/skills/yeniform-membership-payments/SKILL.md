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
- **Web:** existing Stripe Checkout + `api/stripe-webhook.js`.
- **Source of truth:** Supabase `members.membership`, `membership_status`, package/expiry in `members.data` (and related fields).

## Plan IDs

**Satılan:** `diyet` | `spor` | `doktor` | `vip` (`SELLABLE_PLAN_IDS`)  
**Fallback:** `free` (süresi bitmiş)  
**Eski (yeni satış yok):** `eko` — mevcut üyeler admin ile taşınır  

Durations: 1 / 3 / 6 months (`doktor` = one-time). Ücretsiz kayıt yok — onboarding Stripe zorunlu.

## Gate helpers (parity with web)

From `src/data/membershipPlans.js` — copy into mobile:

- `hasManualCalorieAccess` — not free/doktor/kurucu
- `hasPhotoCalorieAccess` — diyet, spor, vip (+ legacy platinum/premium)
- `hasFullVideoAccess` — spor, vip (+ legacy)
- Package quotas: `PACKAGE_BY_PLAN` / `getDefaultPackageForPlan`

## When coding or documenting

1. Never unlock paid features client-only; server/RLS + membership row must agree.
2. New webhook: RevenueCat → update same fields as Stripe webhook.
3. Expiry → downgrade to `free` (`api/_membershipExpiry.js` / `syncMemberPackages`).

## Related

[reference.md](reference.md) · Supabase skill for RLS
