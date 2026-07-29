# Membership & Payments — Reference

## Quotas (seed / `plans.entitlements`)

| Plan | Coach/mo | Dietitian/mo | Doctor | photo | manual | video |
|------|----------|--------------|--------|-------|--------|-------|
| eko_diyet | 0 | 1 | 1/mo | yes | yes | no |
| diyet | 0 | 2 | 1/mo | yes | yes | no |
| eko_spor | 1 | 0 | 0 | yes | yes | yes |
| spor | 2 | 0 | 0 | yes | yes | yes |
| doktor | 0 | 0 | `doctorSessionsTotal: 1`, `billing_type: one_time` | no | no | no |
| vip | 2 | 2 | 1/mo | yes | yes | yes |
| eko (legacy) | 0 | 0 | 0 | no | yes | no |

Admin may create additional plan IDs with custom entitlements.

## Pricing (monthly TRY — verify DB `plans.pricing_tiers`)

| Plan | 1 ay | 3 ay | 6 ay |
|------|------|------|------|
| eko_diyet | 1299 | 2999 | 3999 |
| diyet | 2499 | 6499 | 9999 |
| eko_spor | 1299 | 2999 | 3999 |
| spor | 2499 | 6499 | 9999 |
| doktor | 1500 one-time | — | — |
| vip | 4999 | 12999 | 19999 |

## Key web files

- `src/data/membershipPlans.js` — catalog helpers, `SELLABLE_PLAN_IDS` fallback, entitlements
- `src/pages/admin/AdminPlansPage.jsx` — full plan CRUD
- `src/services/supabaseDb.js` — `rowToPlan`, `upsertPlan`, `deletePlan`, hydrate
- `api/_planEntitlements.js` — server plan load + packageConfig
- `api/stripe-checkout.js` — DB `is_sellable` validation
- `api/stripe-webhook.js` — entitlements snapshot on payment
- `api/_memberEntitlements.js` — calorie API guards
- `src/components/membership/UnpaidMemberGate.jsx` — paketsiz üye paneli kilidi (HT hariç)
- Ücretsiz kayıt: `OnboardingPage` → `register(..., 'free')`; AI analiz: `useHealthAnalysisSync` + `api/ai-health-analysis` unpaid 403
- `src/services/stripePayment.js`, `api/_stripe.js` (legacy price fallback)
- `members.stripe_customer_id` — webhook/checkout persist; Portal için gerekli
- `src/services/premiumMembership.js`
- `api/_membershipExpiry.js` — cron membership-expiry
- `src/services/supabaseDb.js` → `changeMemberPlan`, `adminUpdatePremiumMembership`
- `src/data/staffPayouts.js`, `src/services/sessionAttendance.js`, `staff_earnings` table

## DB columns (`public.plans`)

`emoji`, `is_sellable`, `billing_type` (`recurring`|`one_time`), `entitlements` jsonb — migration `20260729_plans_entitlements.sql`

## IAP SKU naming (convention for docs)

`yf_{plan}_{months}m` e.g. `yf_vip_6m`, `yf_eko_diyet_1m`, `yf_doktor_once`  
(New admin plan IDs need matching store products separately — not auto-created.)
