# F15 — Entitlement: IAP vs Stripe

## Rule

UI never trusts store alone. After purchase or login:

1. Read Supabase `members.membership` (+ expiry, packageConfig)  
2. Optionally restore RevenueCat → webhook/sync if mismatch  
3. Feature gates use server membership  

## Scenarios

| Bought on | Opens app | Expected |
|-----------|-----------|----------|
| Web Stripe | Mobile login | Paid features on |
| Mobile IAP | Web login | Paid features on |
| IAP pending webhook | Immediate | “İşleniyor” then refresh |
| Refund/revoke | Either | Downgrade on webhook |

Acceptance: single source of truth = Supabase row.
