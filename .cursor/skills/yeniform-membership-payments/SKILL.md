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

`free` | `eko` | `diyet` | `spor` | `doktor` | `vip`  
Durations: 1 / 3 / 6 months (`doktor` = one-time).

## Gate helpers (parity with web)

From `src/data/membershipPlans.js` — copy into mobile:

- `hasManualCalorieAccess` — not free/doktor/kurucu
- `hasPhotoCalorieAccess` — diyet, spor, vip (+ legacy platinum/premium)
- `hasFullVideoAccess` — spor, vip (+ legacy)
- Package quotas: `PACKAGE_BY_PLAN` / `getDefaultPackageForPlan`

## When coding or documenting

1. Read `docs/mobile/04-payments-iap.md` and `domains/membership-entitlements.md`.
2. Never unlock paid features client-only; server/RLS + membership row must agree.
3. New webhook: RevenueCat → update same fields as Stripe webhook.
4. Expiry → downgrade to `free` (parity `syncMembershipExpiryStatus`).

## Related

[reference.md](reference.md) · Supabase skill for RLS
