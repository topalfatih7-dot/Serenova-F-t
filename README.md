# Yeni Form — Online Koçluk & Wellness

React + Vite tabanlı online koçluk/wellness platformu. Üyelik, premium paket oluşturucu, koç/diyetisyen randevuları, blog, destek talepleri ve admin paneli içerir.

## Çalıştırma

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama **Supabase** ile çalışır. `.env.local` içinde `VITE_SUPABASE_URL` ve publishable key tanımlı olmalıdır.

## Kurulum özeti

1. `.env.example` → `.env.local` kopyala; Supabase + diğer anahtarları doldur.
2. Taze DB: `supabase/setup.sql` (SQL Editor) veya artımlı: `npm run db:migrate`.
3. Admin: `admin@yeniform.com` — şifreyi `/admin/account` veya Supabase Dashboard’dan ayarla.

**AI proje rehberi (sıkı):** [`AI_PROJE_REHBERI.md`](./AI_PROJE_REHBERI.md) — kurallar, durum, AI/API haritası. Satış modeli: ücretli paketler (ücretsiz kayıt yok). Denetim: [`docs/ROADMAP_DENETIM.md`](./docs/ROADMAP_DENETIM.md). Detay: `.cursor/skills/yeniform-*`.  
**E-posta şablonları:** [`supabase/email-templates/README.md`](./supabase/email-templates/README.md)  
**Video ops:** [`docs/VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md`](./docs/VIDEO_LATENCY_AND_PLAYBACK_RUNBOOK.md)

Vercel’de aynı değişkenleri Environment Variables bölümüne ekleyin.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Derlemeyi önizle |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Supabase migration uygula |
