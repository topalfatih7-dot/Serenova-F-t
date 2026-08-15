# Güvenlik operasyon notları

## Public form koruması

- Tüm public formlar `/api/contact` üzerinden gider (`action`: `contact` | `staff_application` | `corporate_application` | `staff_doc_upload`).
- Production: `TURNSTILE_SECRET_KEY` + `VITE_TURNSTILE_SITE_KEY` zorunlu.
- Localhost (`npm run dev` / host `localhost`): bot kontrolü otomatik atlanır; giriş CAPTCHA’sız service-role password grant kullanır.
- Rate limit: Upstash (`UPSTASH_REDIS_REST_*`) tercih; yoksa bellek içi yedek + Postgres RPC limitleri.
- `submit_*` RPC’leri yalnızca `service_role` ile çağrılır.

## Saldırı Telegram uyarısı (OPS chat)

- Kanal: `TELEGRAM_OPS_CHAT_ID` (yoksa `TELEGRAM_CHAT_ID`) — supabase-health ile aynı.
- Tetikleyenler: Turnstile fail (≥3/10dk), Turnstile eksik (≥8/10dk — client reset yarışı), rate limit (ilk 429), honeypot, auth rate limit, disposable email.
- Cooldown: aynı neden için 10 dakika (Upstash key `serenova:attack-cooldown:*`).
- Kod: `api/_attackAlert.js` ← `api/contact.js` + `api/auth.js`.

## Auth bot koruması (signup / login)

- UI giriş/kayıt → görünür Turnstile managed widget (`appearance: always`, `execution: render`) + `useTurnstile`; token tek kullanımlık — hata sonrası `reset()`, asla React `key` remount / token reuse yok.
- Stabil hata kodları: `TURNSTILE_REQUIRED` | `TURNSTILE_INVALID` (client reset tetikler).
- Signup 3/saat (IP+email); login credential fail 12/saat (IP+email); login captcha denemesi 40/saat (IP) — yanık token credential kotasını yakmaz.
- Disposable domain engeli (`api/_disposableEmail.js`).
- Production’da client doğrudan `signUp` / `signInWithPassword` kullanmaz.
- **Dashboard (zorunlu sıfıra yaklaşmak için):** Authentication → Bot and Abuse Protection → CAPTCHA = Cloudflare Turnstile + aynı `TURNSTILE_SECRET_KEY`. Bu, anon key ile doğrudan `/auth/v1/token` brute-force’unu keser.
- Login/unlock: Turnstile token **Supabase’e iletilir** (biz siteverify etmeyiz — token tek kullanımlık). Signup API hâlâ kendi siteverify’ını yapar (admin RPC).
- **Kayıt sonrası oturum:** Signup `authSessionToken` üretir; `password-login` bu oturumla **service-role password grant** kullanır (Turnstile tekrar istenmez — signup token’ı zaten tüketilmiştir).

## Vercel / WAF (manuel)

Vercel Dashboard → Project → Firewall / Attack Challenge:

1. `/api/contact` — IP başına dakikada ~20 istek üstü challenge veya block.
2. `/api/auth` — signup/password-reset için benzer eşik.
3. `/api/ai-*` — authenticated abuse için IP + path rule.

Cloudflare kullanılıyorsa aynı path’lere rate limit rule ekleyin.

## Periyodik denetim (aylık)

1. Supabase MCP / Dashboard: Security Advisors.
2. `contact_inquiries` / `*_applications` son 24s hacim kontrolü.
3. `ai_usage_logs` anormal kullanıcı trafiği.
4. Auth log’larında brute-force spike.
5. Bundle’da `TELEGRAM_*` / `SERVICE_ROLE` / `TURNSTILE_SECRET` sızıntısı olmadığını doğrula (`VITE_` prefix yok).

## Stripe webhook (manuel Dashboard) — KAPANDI (2026-08-14)

> Tam checklist: [`docs/OPS_STRIPE_WEBHOOK.md`](OPS_STRIPE_WEBHOOK.md)

Subscription yenileme için endpoint’te şu event’ler **açık olmalı** (kod zaten işliyor):

1. `checkout.session.completed` / `checkout.session.async_payment_succeeded` (mevcut)
2. `invoice.paid` — dönem yenileme (`renewMembership`)
3. `customer.subscription.deleted` — `stripeSubscriptionId` temizliği

Dashboard → Developers → Webhooks → endpoint → Events to send.  
Vercel `STRIPE_WEBHOOK_SECRET` = endpoint signing secret.

## Bilinçli advisor istisnaları (2026-07-29)

- `members_staff_safe`: `security_invoker = true` (iletişim strip + `staff_manages_member`). Eski SECURITY DEFINER ERROR kapatıldı.
- `is_admin()` → `anon` EXECUTE: RLS policy değerlendirmesi için gerekli; fonksiyon yalnızca admin e-postasını döner.
- `phone_in_use` → `anon`: kayıt/telefon doğrulama.
- `get_online_stats` → `anon`: landing canlı sayaç.
- `admin_*` / `append_*` / `book_staff_session` vb. → `authenticated` EXECUTE: fonksiyon gövdesinde `is_admin()` / staff check vardır; revoke etme.
