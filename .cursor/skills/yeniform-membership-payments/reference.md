# Membership & Payments — Reference

## Quotas (PACKAGE_BY_PLAN)

| Plan | Coach/mo | Dietitian/mo | Doctor |
|------|----------|--------------|--------|
| diyet | 0 | 2 | 1 (package field) |
| spor | 2 | 0 | 1 |
| doktor | 0 | 0 | `doctorSessionsTotal: 1`, `billingType: one_time` |
| vip | 2 | 2 | 1 |
| eko (legacy) | 0 | 0 | 0 |

## Pricing (monthly TRY — verify `membershipPlans.js` / DB `plans`)

| Plan | 1 ay | 3 ay | 6 ay |
|------|------|------|------|
| diyet | 2499 | 6499 | 9999 |
| spor | 2499 | 6499 | 9999 |
| doktor | 1500 one-time | — | — |
| vip | 4999 | 12999 | 19999 |

## Key web files

- `src/data/membershipPlans.js` — `SELLABLE_PLAN_IDS`, `ADMIN_ASSIGNABLE_PLAN_IDS`, `isPaidMembership`
- `src/components/membership/UnpaidMemberGate.jsx` — paketsiz üye paneli kilidi
- `src/services/stripePayment.js`, `api/stripe-checkout.js` (Checkout + portal), `api/stripe-webhook.js`, `api/_stripe.js`
- `members.stripe_customer_id` — webhook/checkout persist; Portal için gerekli
- `src/services/premiumMembership.js`
- `api/_membershipExpiry.js` — cron membership-expiry
- `src/services/supabaseDb.js` → `changeMemberPlan`, `adminUpdatePremiumMembership`
- `src/data/staffPayouts.js`, `src/services/sessionAttendance.js`, `staff_earnings` table

## IAP SKU naming (convention for docs)

`yf_{plan}_{months}m` e.g. `yf_vip_6m`, `yf_doktor_once`
