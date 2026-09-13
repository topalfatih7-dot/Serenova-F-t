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

## Vercel / WAF

Hedef path’ler (eşik: IP başına ~20 istek / dakika; aşımda challenge, hard block değil):

1. `/api/contact` — public form / başvuru.
2. `/api/auth` — signup / password-reset.
3. `/api/ai-*` — authenticated AI abuse (`/api/ai-food-text`, `/api/ai-food-vision`, `/api/ai-health-analysis`, `/api/ai-blog-generate`).

**Yapılandırıldı (2026-09-13)** — proje `serenova-f-t` (`www.yeniform.com`), takım Hobby.

- Canlı kural: `Rate limit contact/auth/ai APIs` (`rule_rate_limit_api_contact_pHBYB5`), WAF config `waf_Mf6KbDl3mGaK` v1.
- Action: `rate_limit` 20 istek / 60s / IP (`fixed_window`); aşımda `challenge`.
- Hobby limiti: proje başına **1** WAF rate-limit kuralı (ayrıca en fazla 3 custom rule). Üç path bu yüzden tek kuralda OR ile birleşik; sayaç üç path arasında paylaşılır. Ayrı kural (Pro, 40 rate-limit) için yükseltme gerekir — satın alma yapılmadı.
- Dashboard: Vercel → `serenova-f-t` → Firewall. CLI: `vercel firewall rules list --expand`.
- Sayaçlar bölge başına tutulur (`fra1` birincil).

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

## Sertleştirme (2026-09-13)

- Checkout e-postası ve Stripe müşteri eşlemesi yalnızca oturumdaki üyeden; dönüş URL’si `APP_URL`.
- `staff-application-docs` bucket **private**; admin imzalı URL ile açar.
- Egzersiz videosu imzası program-scoped (personel/admin / `fullLibraryAccess` hariç).
- Üye JSON: `fullLibraryAccess`, `stripeSubscriptionId`, `waterTracking` tetikleyici ile kilitli.
- Sohbet insert: gönderen = `auth.uid()`. Ops Telegram metni oturum kimliğinden.

## Bilinçli advisor istisnaları (2026-07-29)

- `members_staff_safe`: `security_invoker = true` (iletişim strip + `staff_manages_member`). Eski SECURITY DEFINER ERROR kapatıldı.
- `is_admin()` → `anon` EXECUTE: RLS policy değerlendirmesi için gerekli; fonksiyon yalnızca admin e-postasını döner.
- `phone_in_use` → `anon`: kayıt/telefon doğrulama.
- `get_online_stats` → `anon`: landing canlı sayaç.
- `admin_*` / `append_*` / `book_staff_session` vb. → `authenticated` EXECUTE: fonksiyon gövdesinde `is_admin()` / staff check vardır; revoke etme.
- `product_nutrition_cache` / `usda_food_cache`: RLS + açık deny (yazma `service_role`).
- `tg_chat_message_touch_thread()` → **REVOKE** (2026-08-31): trigger olarak çalışır; REST RPC yüzeyi kapatıldı.

## Leaked Password Protection (AÇIK — 2026-09-13)

HaveIBeenPwned / leaked password protection **açık** (2026-09-13). Advisor `auth_leaked_password_protection` uyarısı kalktı.

Dashboard → Authentication → Attack Protection → **Prevent use of leaked passwords** = ENABLED  
(Email provider: Authentication → Sign In / Providers → Email).  
https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

Signup HIBP'yi service-role RPC ile bilinçli atlıyoruz (`register_email_user`); bu ayar doğrudan GoTrue `signUp` / şifre değişimini korur.

## Saatlik cron (Hobby)

Vercel Hobby günde 1 cron. Saatlik işler GitHub Actions + **www.yeniform.com** (SSO'suz custom domain):

- [`.github/workflows/supabase-health.yml`](../.github/workflows/supabase-health.yml)
- [`.github/workflows/session-reminders.yml`](../.github/workflows/session-reminders.yml) — randevu T-24s/T-1s (`ok: false` → job kırmızı)
- Expo receipts: `push_receipts` (service_role only) · `?task=push-receipts` · membership-expiry cron piggyback

Ayrıntı: [`docs/OPS_NOTIFICATIONS.md`](OPS_NOTIFICATIONS.md)
