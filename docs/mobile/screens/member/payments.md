# Member — Payment Management (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile/payments`
- **Web:** `PaymentManagementPage.jsx` audience=member (partially mock on web)
- **Priority:** P1

## MOBILE DIFF (required)

1. Show current membership + expiry from Supabase (real)
2. Manage subscription via RevenueCat Customer Center / restore
3. Optional list of `payments` rows if present
4. Label any remaining mock sections clearly — prefer real IAP manage over web mock

## Strings

Restore: use RevenueCat restore + refresh membership (F15).

## Acceptance

- [ ] No fake payment history presented as real
- [ ] Entitlement from Supabase
