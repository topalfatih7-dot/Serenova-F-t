# Public — Membership Comparison (IMPLEMENTATION LOCK)

- **Expo:** `/(public)/membership`
- **Web:** `/membership` → `MembershipComparisonPage.jsx`
- **Priority:** P0 (upsell + onboarding entry)

---

## Data

- Plans: DB `plans` via hydrate OR fallback `ALL_PLANS` from `membershipPlans.js`
- Display order: `PLAN_DISPLAY_ORDER` / `sortPlansForDisplay`
- Pricing: `getTierPrice`, `DURATION_OPTIONS` 1/3/6, `RECOMMENDED_PLAN` = vip, `RECOMMENDED_DURATION_MONTHS` = 6

## CTA behavior

- Logged-out / incomplete → `/onboarding?plan={id}&months={n}`
- Logged-in registered member → onboarding PlanChangeView or `/onboarding?plan=`
- Do not invent plan ids beyond free|eko|diyet|spor|doktor|vip

## Mobile paid

Purchase CTA on this page for logged-in users may deep-link to IAP flow (MOBILE DIFF) — still same plan/duration ids as `04-payments-iap.md`.

## Copy / layout

Port section structure from MembershipComparisonPage (how-it-works, compare, reassurance).  
Do not reintroduce removed “taahhüt” marketing language (web removed it).

## Acceptance

- [ ] Plan ids + pricing helpers parity  
- [ ] Duration 1/3/6  
- [ ] CTA routes exact  
