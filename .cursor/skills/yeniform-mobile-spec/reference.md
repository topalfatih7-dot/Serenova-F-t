# Mobile Spec — Reference

## Locked product decisions

- Brand: Yeni Form (`yeniform.com`)
- Expo + Expo Router; panels: member + staff + admin
- Payments: RevenueCat IAP (mobile) + Stripe (web); entitlement = Supabase `members.membership` + expiry fields
- State model parity: `useAuth` / `useData` / `useActions`

## Web route map (source of truth for inventory)

See `src/App.jsx` and `docs/mobile/03-navigation.md` / `appendices/A-screen-inventory.md`.

## Writing order

1. Foundations 00–05  
2. `domains/` (membership, health catalog, chat, programs, media)  
3. `flows/F01–F15`  
4. `screens/*`  
5. `contracts/*`  
6. Appendices inventory + roadmap  

## Do not

- Scaffold Expo app while only asked for docs
- Leave TBD for plan gates — copy from `src/data/membershipPlans.js` into domains
