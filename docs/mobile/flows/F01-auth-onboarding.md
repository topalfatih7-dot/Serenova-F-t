# F01 — Auth & onboarding (özet sözleşme)

## Actors

Yeni kullanıcı (e-posta veya Google).

## Happy path — ücretsiz

1. `/(auth)/onboarding` Step hesap → plan `free`  
2. API: `POST /api/auth` `action: signup` (+ Turnstile web; mobilde eşdeğer bot koruması)  
3. `members` satırı `membership: free`, `freeTrialExpiresAt`  
4. Dashboard + HT açık; ActivationChecklist  

## Happy path — ücretli (mobil)

1. Onboarding plan seç (sellable id)  
2. RevenueCat purchase  
3. Entitlement sync → paid membership  
4. Dashboard  

## Happy path — ücretli (web not)

Stripe Checkout Subscription; mobil bu yolu kullanmaz.

## Errors

| Durum | UX |
|-------|-----|
| Disposable email | Engelle |
| Rate limit | Retry mesajı |
| Eksik profil | ProfileCompletionGate |

## Acceptance

- [ ] Free kayıt 48s deneme alanları set  
- [ ] Paid olmadan unpaid gate yüzeyleri kilitli  
- [ ] OAuth callback deep link çalışır  

Detay ekran spec’leri: `screens/public/onboarding.md` (sonraki sprint).
