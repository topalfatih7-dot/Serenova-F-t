# Kurulum Rehberleri — Yeni Form

> Tüm harici servis kurulum adımları bu klasördedir.  
> **Yapılacaklar özeti:** kök dizindeki [`YAPILACAKLAR.md`](../../YAPILACAKLAR.md)  
> **Proje rehberi (AI):** [`AI_PROJE_REHBERI.md`](../../AI_PROJE_REHBERI.md) → §7.0

---

## Hızlı indeks

| Rehber | Konu | Durum |
|--------|------|-------|
| [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Veritabanı, Auth, RLS, admin | ✅ Temel kurulum |
| [OAUTH_SETUP.md](./OAUTH_SETUP.md) | Google, Facebook, Apple (özet) | ⬜ Sağlayıcılar Dashboard'da |
| [APPLE_SETUP.md](./APPLE_SETUP.md) | Sign in with Apple (detaylı) | ⬜ **Ertelendi** |
| [STRIPE_SETUP.md](./STRIPE_SETUP.md) | Ödeme, webhook, Vercel env | ⬜ Canlı anahtarlar |
| [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) | Bot, chat ID, bildirimler | Kısmen |
| [AI_SETUP.md](./AI_SETUP.md) | Gemini API, kalori AI | ✅ |
| [VIDEO_SETUP.md](./VIDEO_SETUP.md) | Daily.co video görüşme | ✅ |
| [SEO_SETUP.md](./SEO_SETUP.md) | Search Console, sitemap, OG | ✅ |

**SQL şema (tek dosya):** [`supabase/setup.sql`](../../supabase/setup.sql)  
**Migration'lar:** `supabase/migrations/` → `npm run db:migrate`  
**E-posta şablonları:** [`supabase/email-templates/README.md`](../../supabase/email-templates/README.md)

---

## Öncelik sırası (satışa hazırlık)

| Öncelik | Rehber | Aksiyon |
|---------|--------|---------|
| P0 | [STRIPE_SETUP.md](./STRIPE_SETUP.md) | Vercel'de `STRIPE_*` + `VITE_STRIPE_ENABLED=true` |
| P0 | [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) | Admin şifresi değiştir, Leaked Password Protection |
| P1 | [OAUTH_SETUP.md](./OAUTH_SETUP.md) | Google provider (Apple: [APPLE_SETUP.md](./APPLE_SETUP.md)) |
| P1 | [TELEGRAM_SETUP.md](./TELEGRAM_SETUP.md) | Eksik chat ID / kanal ayarları |
| P2 | [APPLE_SETUP.md](./APPLE_SETUP.md) | Apple Developer hesabı hazır olunca |
| P2 | [SEO_SETUP.md](./SEO_SETUP.md) | Periyodik Search Console kontrolü |

---

## Supabase proje bilgileri

| Alan | Değer |
|------|--------|
| Proje ref | `rvzksmyhsgxgrxgeabmi` |
| OAuth callback (Google/Apple/Facebook) | `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback` |
| Auth Providers | https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers |
| Site URL (prod) | `https://www.yeniform.com` |
| App callback | `https://www.yeniform.com/auth/callback` |

---

## Ortam değişkenleri

Şablon: [`.env.example`](../../.env.example)  
Detaylı tablo: [`AI_PROJE_REHBERI.md` §8](../../AI_PROJE_REHBERI.md)

---

## Klasör yapısı

```
docs/
└── setup/
    ├── README.md           ← bu dosya (indeks)
    ├── SUPABASE_SETUP.md
    ├── OAUTH_SETUP.md
    ├── APPLE_SETUP.md      ← Apple detay (ertelendi)
    ├── STRIPE_SETUP.md
    ├── TELEGRAM_SETUP.md
    ├── AI_SETUP.md
    ├── VIDEO_SETUP.md
    └── SEO_SETUP.md
```

Kök dizindeki eski `*_SETUP.md` dosyaları yalnızca yönlendirme stub'ıdır; asıl içerik burada.
