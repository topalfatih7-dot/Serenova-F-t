# Güvenlik operasyon notları

## Public form koruması

- Tüm public formlar `/api/contact` üzerinden gider (`action`: `contact` | `staff_application` | `corporate_application` | `staff_doc_upload`).
- Production: `TURNSTILE_SECRET_KEY` + `VITE_TURNSTILE_SITE_KEY` zorunlu.
- Rate limit: Upstash (`UPSTASH_REDIS_REST_*`) tercih; yoksa bellek içi yedek + Postgres RPC limitleri.
- `submit_*` RPC’leri yalnızca `service_role` ile çağrılır.

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
