# Supabase bölge taşıma — ap-south-1 → eu-central-1

> **Durum:** Kod/performans iyileştirmeleri tamam. Canlı kesim **manuel onay** ister (yeni proje maliyeti + env switch).  
> Hedef: Türkiye kullanıcıları + Vercel `fra1` ile düşük RTT.

## Neden

| Bileşen | Şimdi | Hedef |
|---------|-------|-------|
| Supabase | `ap-south-1` (Mumbai) | `eu-central-1` (Frankfurt) |
| Vercel API | `regions: ["fra1"]` ([vercel.json](../vercel.json)) | aynı |
| Kullanıcı | TR | TR |

## Önkoşullar

1. Supabase org’da Pro/Free slot ve maliyet onayı
2. Eski proje **1 hafta** dondurulmadan bekletilir (rollback)
3. Yerelde `.env.local` yedeği + Vercel env screenshot

## Adımlar

### 1) Yeni proje

Dashboard veya MCP: org seç → region **West EU (Frankfurt) / eu-central-1** → proje adı örn. `yeni-form-eu`.

### 2) Şema

Yeni projenin URL + service role ile:

```bash
# .env.region-target örneği
export VITE_SUPABASE_URL=https://XXXX.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=...
export SUPABASE_SERVICE_ROLE_KEY=...
export DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres

npm run db:migrate
# veya: tüm supabase/migrations/*.sql sırayla apply
```

Ayrıca `supabase/setup.sql` gerekirse bir kez.

### 3) Veri

Kaynak (Mumbai) → hedef (EU):

```bash
# Kaynak dump (public data only)
pg_dump "$SOURCE_DATABASE_URL" \
  --data-only --schema=public \
  --no-owner --no-privileges \
  -f /tmp/yf-public-data.sql

# Hedefe yükle (şema zaten uygulanmış olmalı)
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/yf-public-data.sql
```

Auth kullanıcıları için yardımcı: [`scripts/migrate-auth-users.mjs`](../scripts/migrate-auth-users.mjs) (service role list + createUser, şifre hash Admin API ile taşınamazsa kullanıcılar reset maili alır — küçük kullanıcı tabanında kabul edilebilir).

### 4) Storage

Bucket’lar: `exercise-videos` (private), `exercise-thumbs` (public), `health-lab-results` (private), varsa `staff-applications`.

```bash
node scripts/migrate-storage-buckets.mjs
# SOURCE_* ve TARGET_* env gerekir — bkz. script başlığı
```

### 5) Auth / OAuth

Yeni projede:

- Google OAuth client → redirect: `https://XXXX.supabase.co/auth/v1/callback`
- Site URL: `https://www.yeniform.com`
- Redirect allowlist: `/auth/callback`, localhost

### 6) Env switch (kesim penceresi)

Vercel Production:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Redeploy. Stripe webhook URL değişmez; DB yeni projeye yazar.

### 7) Doğrulama checklist

- [ ] Giriş / kayıt / Google OAuth
- [ ] Chat realtime
- [ ] Egzersiz video signed URL + thumb
- [ ] Stripe test checkout + webhook
- [ ] Admin panel hydrate
- [ ] `curl -sD - -X POST https://www.yeniform.com/api/auth -H 'Content-Type: application/json' -d '{}'` → `x-vercel-id` içinde `fra1`

### 8) Rollback

Vercel env’leri eski Mumbai projesine geri al → redeploy. Eski proje silinmez.

## Ops notları

- Auth DB connection strategy: Dashboard → Project Settings → Auth → yüzde bazlı allocation
- Stripe: `invoice.paid` + `customer.subscription.deleted` event’leri — [OPS_STRIPE_WEBHOOK.md](OPS_STRIPE_WEBHOOK.md)
