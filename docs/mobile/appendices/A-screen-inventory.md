# A — Screen inventory (web SoT → Expo route önerisi)

Kaynak: `src/App.jsx` (2026-07-29). Öncelik: P0 = MVP launch.

## Public

| Web path | Expo önerisi | P | Not |
|----------|--------------|---|-----|
| `/` | `/(public)/index` | P2 | Marketing; deep link membership |
| `/login` | `/(auth)/login` | P0 | |
| `/forgot-password` | `/(auth)/forgot-password` | P1 | |
| `/reset-password` | `/(auth)/reset-password` | P1 | |
| `/onboarding` | `/(auth)/onboarding` | P0 | free + paid plan |
| `/membership` | `/(public)/membership` | P0 | |
| `/auth/callback` | `/(auth)/callback` | P0 | OAuth |
| `/online-diyetisyen` | web-only veya WebView | P3 | SEO |
| `/online-kocluk` | web-only | P3 | |
| `/hakkimizda` | `/(public)/about` | P2 | |
| `/stories` | `/(public)/stories` | P2 | |
| `/blog`, `/blog/:id` | `/(public)/blog` | P2 | |
| `/team/*` | `/(public)/team` | P2 | |
| `/corporate` | P3 | | |
| `/legal/:slug` | `/(public)/legal/[slug]` | P1 | |

## Member (`RequireAuth` + AppShell)

| Web path | Expo | P | Gate |
|----------|------|---|------|
| `/dashboard` | `/(member)/dashboard` | P0 | deneme veya ücretli |
| `/health-test*` | `/(member)/health-test` | P0 | deneme AI 1× |
| `/calendar` | `/(member)/calendar` | P0 | unpaid gate |
| `/calorie` | `/(member)/calorie` | P1 | entitlement |
| `/schedule` | `/(member)/schedule` | P0 | unpaid gate |
| `/messages` | `/(member)/messages` | P0 | unpaid gate |
| `/programs` | `/(member)/programs` | P0 | unpaid gate |
| `/library` | `/(member)/library` | P0 | unpaid + program-scoped |
| `/notifications` | `/(member)/notifications` | P1 | |
| `/support` | `/(member)/support` | P1 | |
| `/profile` | `/(member)/profile` | P0 | |
| `/profile/payments` | `/(member)/payments` | P0 | IAP manage / restore |
| `/call/:type/:id` | `/(member)/call/...` | P0 | Daily |

## Staff

| Web path | Expo | P |
|----------|------|---|
| `/staff` | `/(staff)/index` | P0 |
| `/staff/clients` | `/(staff)/clients` | P0 |
| `/staff/clients/:id/health` | P0 | |
| `/staff/clients/:id/program` | koç P0 | |
| `/staff/clients/:id/list` | diyetisyen P0 | |
| `/staff/messages` | P0 | |
| `/staff/admin-messages` | P1 | |
| `/staff/collab-messages` | koç+diyet P1 | |
| `/staff/programs` | koç P0 | |
| `/staff/lists` | diyet P0 | |
| `/staff/library` | koç P1 | |
| `/staff/payments` | P1 | earnings |
| `/staff/profile` | P1 | |
| `/staff/call/...` | P0 | |

## Admin

| Web path | Expo | P |
|----------|------|---|
| `/admin` | `/(admin)/index` | P1 |
| `/admin/members` | P0 | |
| `/admin/premium` | P0 | |
| `/admin/plans` | P1 | |
| `/admin/programs` | P1 | |
| `/admin/applications` | P1 | |
| `/admin/library` | P1 | |
| `/admin/staff` | P1 | |
| `/admin/payments` | P1 | |
| `/admin/sessions` | P1 | |
| `/admin/messages*` | P1 | |
| `/admin/support` | P1 | |
| `/admin/blog` | P2 | |
| `/admin/content` | P2 | |
| `/admin/analytics` | P2 | |
| `/admin/ai-costs` | P2 | |
| `/admin/activity` | P2 | |
| `/admin/account` | P2 | |

## Sonraki spec dosyaları

Her P0 satır için `screens/{panel}/*.md` (skill şablonu). Önce `flows/F01-auth-onboarding.md`, `F02-iap-purchase.md`, `F03-health-test.md`.
