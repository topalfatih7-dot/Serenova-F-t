# Yeni Form — Cursor Project Skills

Bu skill’ler **otomatik tetiklenir** (`disable-model-invocation` yok). Agent, istekteki anahtar kelimelere göre ilgili `SKILL.md` dosyasını okur.

## Yönlendirme

| İş türü | Skill |
|---------|--------|
| Her mobil / Expo / RN / docs/mobile işi | **yeniform-mobile-router** (önce) |
| Spesifikasyon / handoff | yeniform-mobile-spec |
| Expo uygulama kodu | yeniform-expo-app |
| Paket / IAP / Stripe | yeniform-membership-payments |
| Auth / onboarding | yeniform-auth-onboarding |
| Chat / Daily / push | yeniform-chat-realtime-video |
| Sağlık / takvim / program / kalori | yeniform-health-programs |
| Staff / admin | yeniform-staff-admin |
| Egzersiz videosu / signed URL | yeniform-media-exercises |

Supabase şema/RLS: `.agents/skills/supabase*`.

Mobil handoff kaynağı: `docs/mobile/` — önce `IMPLEMENTATION-LOCK.md` ve `COMPLETE.md`.
