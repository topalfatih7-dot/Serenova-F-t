# Güvenlik operasyon notları

## Public form koruması

- Tüm public formlar `/api/contact` üzerinden gider (`action`: `contact` | `staff_application` | `corporate_application` | `staff_doc_upload`).
- Production: `TURNSTILE_SECRET_KEY` + `VITE_TURNSTILE_SITE_KEY` zorunlu.
- Localhost (`npm run dev` / host `localhost`): bot kontrolü otomatik atlanır; giriş CAPTCHA’sız service-role password grant kullanır.
- Rate limit: Upstash (`UPSTASH_REDIS_REST_*`) tercih; yoksa bellek içi yedek + Postgres RPC limitleri.
- `submit_*` RPC’leri yalnızca `service_role` ile çağrılır.

## Saldırı Telegram uyarısı (OPS chat)

- Kanal: `TELEGRAM_OPS_CHAT_ID` (yoksa `TELEGRAM_CHAT_ID`) — supabase-health ile aynı.
- Tetikleyenler: Turnstile fail/eksik (≥3/10dk), rate limit (ilk 429), honeypot, auth rate limit, disposable email.
- Cooldown: aynı neden için 10 dakika (Upstash key `serenova:attack-cooldown:*`).
- Kod: `api/_attackAlert.js` ← `api/contact.js` + `api/auth.js`.

## Auth bot koruması (signup / login)

- UI giriş/kayıt → Turnstile; `POST /api/auth` (`password-login` / `signup`) sunucuda doğrular.
- Signup 3/saat, login 12/saat (IP+email); disposable domain engeli (`api/_disposableEmail.js`).
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
