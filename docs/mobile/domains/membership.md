# Domain — Membership & entitlements

SoT: `src/data/membershipPlans.js`, `src/utils/memberPackages.js`, `api/_planEntitlements.js`, `api/stripe-webhook.js`.

## Sellable IDs

| id | Tip | Özet kota (seed) |
|----|-----|------------------|
| eko_diyet | recurring | diyetisyen 1/ay |
| diyet | recurring | diyetisyen 2/ay |
| eko_spor | recurring | koç 1/ay · fullVideo seed true |
| spor | recurring | koç 2/ay · fullVideo |
| doktor | one_time | doctorSessionsTotal 1 · kalori yok |
| vip | recurring | koç+diyet 2/ay |

Runtime fiyat / `is_sellable` / entitlements: `public.plans` satırı.

## Free + 48s deneme

- Kayıt: `freeTrialExpiresAt = now + 48h`  
- `FREE_TRIAL_MS = 48 * 60 * 60 * 1000`  
- Süresi bitmiş ücretli → yeni deneme yok  

## Mobil satın alma

1. RevenueCat offering → purchase  
2. Webhook / RC sync → `members.membership`, `membership_status`, `data.activePackages`, `premiumExpiresAt`  
3. Restore purchases on login  

Web Stripe Subscription ile aynı alanlar; çift yazım çakışmasında son webhook kazanır (idempotent payment id).

## Gate helpers (port et)

- `isPaidMembership`  
- `isFreeTrialActive` / `canAccessMemberDashboard`  
- `memberHasManualCalorieAccess` / `memberHasPhotoCalorieAccess`  
- `UnpaidMemberGate` eşdeğeri RN component  

## Kütüphane

Üye: yalnız kendi programındaki exercise id’leri + signed URL.  
`fullVideo` entitlement web’de tanımlı ama üye UI program-scoped (LOCK).
