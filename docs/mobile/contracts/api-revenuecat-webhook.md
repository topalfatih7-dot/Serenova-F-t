# Contract — POST /api/revenuecat-webhook (NEW)

## Purpose

Map RevenueCat subscription events → Supabase `members` entitlement fields (parity with Stripe webhook).

## Security

- Verify Authorization / RevenueCat shared secret
- Idempotent by event id

## Events to handle (minimum)

- INITIAL_PURCHASE / RENEWAL → set membership plan + extend `premiumExpiresAt` + packageConfig
- CANCELLATION / EXPIRATION → schedule or immediate downgrade per product rules
- PRODUCT_CHANGE → change plan id + sanitize staff assignments

## Mapping

RevenueCat product id `yf_{plan}_{months}m` → `planId` + `durationMonths`.  
App User ID should equal Supabase `auth.users.id` (configure in SDK).

## Response

`200 { "ok": true }`
