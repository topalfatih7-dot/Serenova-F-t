# Yapılacaklar — Yeni Form (donusum-programi)

> Bu dosya **sizin** yapmanız gereken kurulum adımlarını listeler.  
> Kod tarafında tamamlanan değişiklikler için `AI_PROJE_REHBERI.md` §18'e bakın.

---

## Yerel geliştirme (redeploy gerekmez)

```powershell
npm run dev
```

→ **http://localhost:5173** — Vite + `/api/*` birlikte çalışır (`.env.local` okunur).

- AI, Telegram, Daily API'leri yerelde test edilir; Vercel redeploy gerekmez.
- `.env.local` değiştirdikten sonra sunucuyu yeniden başlatın (`Ctrl+C` → `npm run dev`).
- Vercel'in kendi dev sunucusu (alternatif): `npm run dev:vercel` → http://localhost:3000

| Değişken | Yerel dosya | Açıklama |
|----------|-------------|----------|
| `GEMINI_API_KEY` | `.env.local` | AI kalori |
| `DAILY_API_KEY` | `.env.local` | Video token |
| `VITE_DAILY_DOMAIN` | `.env.local` | `yeniform.daily.co` |
| `VITE_AI_VISION_ENABLED` | `.env.local` | `true` |
| Telegram / Supabase | `.env.local` | Mevcut |

---

## Acil (hemen)

### 1. Telegram token rotate (önerilir)
- `TELEGRAM_CONTACT_CHAT_ID`: Bize Ulaşın formu **ve** kalori chat mesajlarının gideceği chat. Aynı chat kullanılabilir.

### 2. Vercel ortam değişkenleri

Proje: `topalfatih7-3924s-projects/serenova-f-t` (Vercel CLI ile bağlı)

**2026-06-20 güncel:** Supabase, Telegram, Gemini, Daily (`yeniform.daily.co`) Vercel'e eklendi.

Production deploy için bir kez redeploy yeterli; sonrasında env değişikliklerinde redeploy gerekir, **yerel `.env.local` için gerekmez**.

| Değişken | Ortam | Not |
|----------|-------|-----|
| `VITE_SUPABASE_URL` | Production, Preview, Development | `.env.local` ile aynı |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production, Preview, Development | Supabase API keys |
| `TELEGRAM_BOT_TOKEN` | Production, Preview | **VITE_ olmadan** |
| `TELEGRAM_CHAT_ID` | Production, Preview | Giriş/kayıt bildirimleri |
| `TELEGRAM_CONTACT_CHAT_ID` | Production, Preview | İletişim formu + kalori chat |
| `GEMINI_API_KEY` | Production, Preview | AI kalori (chat + fotoğraf) |
| `VITE_AI_VISION_ENABLED` | Production, Preview | `true` |
| `VITE_DAILY_DOMAIN` | Production, Preview, Development | `yeniform.daily.co` |
| `VITE_DAILY_ROOM_PREFIX` | Production, Preview, Development | örn. `donusum` |
| `DAILY_API_KEY` | Production, Preview | Token'lı güvenli odalar (opsiyonel) |
| `VITE_SITE_URL` | Production, Preview, Development | `https://www.yeniform.com` (SEO) |
| `APP_URL` | Production, Preview, Development | `https://www.yeniform.com` (sitemap) |

CLI örneği (PowerShell):

```powershell
"deger" | npx vercel env add DEGISKEN_ADI production
"deger" | npx vercel env add DEGISKEN_ADI preview
```

### 6. Vercel — production deploy

Env'ler Vercel'e eklendi (Gemini, Daily `yeniform.daily.co`, Telegram, Supabase).  
Production'da güncellemek için **bir kez redeploy** yeterli.

SQL Editor'da çalıştırın (veya MCP ile):

`supabase/migrations/20260620_revoke_anon_rpc.sql`

Admin RPC'lerin `anon` rolünden kaldırılması — **henüz uygulanmadıysa zorunlu**.

---

## Orta öncelik

### 4. AI (Gemini) kurulumu

Detay: `AI_SETUP.md`

1. [Google AI Studio](https://aistudio.google.com/apikey) → API key
2. Vercel'e `GEMINI_API_KEY` ekle
3. `VITE_AI_VISION_ENABLED=true` (chat + fotoğraf analizi için aynı bayrak)

> Eski `VITE_AI_FOOD_ENABLED` ve `custom_foods` otomatik kayıt **kaldırıldı** — artık gerekmez.

### 5. Video görüşme (Daily.co)

Detay: `VIDEO_SETUP.md`

1. Daily.co hesabı → subdomain → `VITE_DAILY_DOMAIN`
2. Production için `DAILY_API_KEY` (Vercel, gizli)
3. Randevu penceresi: `VITE_VIDEO_JOIN_MINUTES_BEFORE` / `AFTER` (opsiyonel)

### 6. Supabase ilk kurulum (yeni ortam)

Detay: `SUPABASE_SETUP.md`

Tek dosya: `supabase/setup.sql` → SQL Editor → Run (idempotent).

### 7. Telegram bot kurulumu

Detay: `TELEGRAM_SETUP.md`

- Bot oluştur, chat id'leri al
- İki chat: sistem bildirimleri vs iletişim/kalori chat

---

## Supabase veri akışı — durum (2026-06-20 test)

| Tablo | Kayıt | Durum |
|-------|-------|-------|
| members | 12 | Kayıt/giriş akışı çalışıyor |
| staff | 2 | Kadro sayfaları navbar'dan |
| payments | 11 | Plan değişiminde yazılıyor |
| tickets | 1 | Destek formu |
| custom_foods | 0 | Artık kalori chat'ten **yazılmıyor** (kasıtlı) |
| membership_requests | 0 | — |

**Kalori chat:** Veritabanına kayıt yok; mesaj → Telegram + AI analiz (oturum içi).  
**Yeni DB tablosu gerekmez** — mevcut şema yeterli.

### Bilinen güvenlik uyarıları (Supabase Advisor)

- `admin_upsert_staff` / `admin_delete_staff` → migration §3 ile düzelt
- `custom_foods` permissive RLS (artık kullanılmıyor; ileride tablo kaldırılabilir)
- Auth leaked password protection kapalı → Dashboard'dan açın

---

## Test checklist

- [ ] Landing: Kadro bölümü yok; navbar → Kadromuz dropdown
- [ ] Navbar → Keşfet → Hikayeler + Blog
- [ ] `/calorie` — chat mesajı Telegram'a düşüyor mu?
- [ ] `/calorie` — AI kalori cevabı geliyor mu? (`GEMINI_API_KEY`)
- [ ] `/call/...` — mobilde tam ekran video + PiP kendi görüntünüz
- [ ] Onboarding sağlık testi — soru başına tek sayfa
- [ ] Vercel deploy sonrası `/api/contact` ve `/api/calorie-chat-notify` 503 vermiyor

---

## Vercel env — buradan yönetim

Cursor oturumunda `npx vercel` ile giriş yapıldı (`topalfatih7-3924`).  
Env ekleme/silme isteklerinizi sohbette yazabilirsiniz; agent CLI ile uygular.

```powershell
npx vercel env ls
npx vercel env pull .env.vercel.local   # uzaktan çek
```

### 6. Vercel CLI

```powershell
npx vercel env ls
npx vercel env pull .env.vercel.local
```

---

---

## SEO & Search Console (www.yeniform.com) — 2026-06-23

Detaylı adımlar: **`SEO_SETUP.md`** · Teknik referans: **`AI_PROJE_REHBERI.md` §23–§24, §29**

### Tamamlanan

**Marka & görseller**
- [x] `public/brand-logo-alt.png` — kaynak logo
- [x] `npm run og:image` → `brand-logo.png`, `brand-mark.png`, `favicon-32.png`, `apple-touch-icon.png`, `og-image.png`
- [x] `BrandLogo.jsx` — gerçek logo PNG (navbar, giriş, kayıt, admin/staff/üye paneli)
- [x] JSON-LD Organization `logo` → `brand-logo.png`
- [x] `index.html` favicon + apple-touch-icon güncellendi
- [x] `site.webmanifest` → `brand-mark.png`

**SEO altyapı**
- [x] `VITE_SITE_URL` + `APP_URL` = `https://www.yeniform.com`
- [x] `robots.txt`, `/sitemap.xml` (15 URL), meta + JSON-LD
- [x] Search Console DNS doğrulama, sitemap, dizin isteği

### Acil — sizin yapmanız gereken

| # | Görev | Nasıl | Detay |
|---|--------|-------|-------|
| 1 | **Deploy** | Vercel production | Logo + og-image canlıya çıksın |
| 2 | **OG debugger testi** | Facebook + LinkedIn | `SEO_SETUP.md` §8 Adım C |
| 3 | **Sitemap durumu** | Search Console | 24–48 saat sonra “Başarılı” mı? |
| 4 | **GA4 ID toplayın** | Google Analytics | `SEO_SETUP.md` §8 Adım A → bana `G-…` yazın |
| 5 | **Sosyal medya URL'leri** | Instagram, Facebook vb. | `SEO_SETUP.md` §8 Adım B → bana linkleri yazın |
| 6 | Kadro fotoğrafları | `/admin/staff` | Eksik profil görselleri |

### Bana vereceğiniz bilgiler (şablon)

Sohbete kopyalayıp doldurun:

```
GA4: G-XXXXXXXXXX
Instagram: https://www.instagram.com/...
Facebook: https://www.facebook.com/...
LinkedIn: https://www.linkedin.com/company/...
(Twitter/YouTube varsa ekleyin)
```

### Opsiyonel / sonra

| Görev | Nerede |
|-------|--------|
| Haftalık Search Console | `SEO_SETUP.md` §8 Adım D |
| Blog içerik kalitesi | `/admin/blog` |
| Backlink / sosyal paylaşım | Dış kanal |

### Logo değiştirmek isterseniz

1. `public/brand-logo-alt.png` dosyasını güncelleyin
2. `npm run og:image`
3. Deploy

---

*Son güncelleme: 2026-06-23 — Marka logo entegrasyonu + SEO görsel standardizasyonu*
