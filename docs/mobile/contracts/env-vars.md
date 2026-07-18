# Contract — Environment Variables (names only)

## Mobile (EXPO_PUBLIC_*)

| Name | Purpose |
|------|---------|
| EXPO_PUBLIC_SUPABASE_URL | Supabase URL |
| EXPO_PUBLIC_SUPABASE_ANON_KEY | Publishable/anon key |
| EXPO_PUBLIC_API_BASE_URL | https://www.yeniform.com or Vercel URL |
| EXPO_PUBLIC_REVENUECAT_API_KEY_IOS | RC public SDK key |
| EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID | RC public SDK key |
| EXPO_PUBLIC_DAILY_DOMAIN | Daily domain |
| EXPO_PUBLIC_TURNSTILE_SITE_KEY | if using Turnstile webview |
| EXPO_PUBLIC_GA4_ID | optional analytics |

## Server (Vercel — already used by web)

SUPABASE_SERVICE_ROLE_KEY, STRIPE_*, DAILY_API_KEY, GEMINI/OPENAI keys, TURNSTILE_SECRET_KEY, UPSTASH_*, CRON_SECRET, TELEGRAM_*, REVENUECAT_WEBHOOK_SECRET (new)

Never put service role or Stripe secret in the mobile binary.
