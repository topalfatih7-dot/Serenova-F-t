# Spesifikasyon tamamlandı

Bu klasör + `.cursor/skills/` seti, Expo mobil uygulamanın **uydurmadan** yazılması için hazır kabul edilir.

## Zorunlu okuma sırası (uygulayıcı AI)

1. `IMPLEMENTATION-LOCK.md`
2. `.cursor/skills/yeniform-mobile-router/SKILL.md`
3. İlgili domain skill
4. İlgili `screens/**` (IMPLEMENTATION LOCK)
5. `contracts/**` + `domains/**`
6. Kod

## Kapsam özeti

| Alan | Durum |
|------|--------|
| Skills (9) | tamam |
| Foundations 00–05 | tamam |
| Flows F01–F15 | tamam |
| Member LOCK screens | tamam (+ session-booker) |
| Staff LOCK screens | tamam |
| Admin LOCK screens | tamam |
| Public LOCK / WebView politikası | tamam |
| Health options tables | tamam |
| API contracts | auth, stripe, daily, AI, book-session, contact, revenuecat, env, mappers |
| Anti-hallucination | IMPLEMENTATION-LOCK |

## Bilinçli sapmalar (MOBILE DIFF)

- Paid purchase: IAP/RevenueCat (web Stripe)
- iOS Apple Sign-In
- Captcha → device attestation stratejisi
- Push notifications
- Payment management: gerçek IAP manage (web mock’u kopyalama)

## Sonraki adım (kod)

Expo scaffold — yalnızca kullanıcı isterse; bu klasör yeterli kaynak.
