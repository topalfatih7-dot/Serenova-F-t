# RevenueCat webhook — KALDIRILDI

**Durum:** 2026-08-08 itibarıyla mobil IAP / RevenueCat iptal edildi.

- `api/revenuecat-webhook.js` **silindi** (Vercel Hobby 12 serverless slot geri alındı).
- Yeni mobil satın alma yok; üyelik satın alma / yönetim **yalnız web Stripe** (`/membership`, `api/stripe-checkout`, `api/stripe-webhook`).
- Mevcut `members` satırlarındaki `provider: revenuecat` paketleri **dokunulmadı** — süre bitene kadar entitlement geçerli kalır; expire cron / `api/_memberPackages.js` provider izolasyonu okuma için duruyor.
- Vercel env: `REVENUECAT_WEBHOOK_SECRET` artık gerekmez — dashboard’dan kaldırın.
- RevenueCat dashboard: webhook entegrasyonu silindi / ürünler arşivlenmeli (MCP).

Mobil auth notları (Turnstile bypass, deep link) artık buraya bağlı değil; auth ops için `api/auth.js` ve mobil handoff dokümanına bakın.

Stripe webhook: [`docs/OPS_STRIPE_WEBHOOK.md`](OPS_STRIPE_WEBHOOK.md)
