# Yeni Form — Cursor Project Skills

Bu skill’ler **otomatik tetiklenir** (`disable-model-invocation` yok). Agent, istekteki anahtar kelimelere göre ilgili `SKILL.md` dosyasını okur.

## Yönlendirme

| İş türü | Skill |
|---------|--------|
| Paket / Stripe / üyelik | yeniform-membership-payments |
| Auth / onboarding | yeniform-auth-onboarding |
| Chat / Daily / bildirim | yeniform-chat-realtime-video |
| Sağlık / takvim / program / kalori | yeniform-health-programs |
| Staff / admin | yeniform-staff-admin |
| Egzersiz videosu / signed URL | yeniform-media-exercises |

Supabase şema/RLS: `.agents/skills/supabase*`.

Bu repo **yalnızca web** (Vite + Vercel + Supabase). Native / Expo / IAP bu projede yok. SoT: `src/` + `api/` + `AI_PROJE_REHBERI.md`.
