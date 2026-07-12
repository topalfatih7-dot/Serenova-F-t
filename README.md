# Yeni Form — Online Koçluk & Wellness

React + Vite tabanlı online koçluk/wellness platformu. Üyelik, premium paket oluşturucu, koç/diyetisyen randevuları, blog, destek talepleri ve admin paneli içerir.

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulama **Supabase** ile çalışır. `.env` dosyasında `VITE_SUPABASE_URL` ve anahtar tanımlı olmalıdır.

## Supabase'e bağlama

Verileri gerçek bir veritabanından (Supabase) çekmek için adım adım rehber:
**[docs/setup/SUPABASE_SETUP.md](./docs/setup/SUPABASE_SETUP.md)**

Tüm kurulum rehberleri: **[docs/setup/README.md](./docs/setup/README.md)**

Özetle:
1. Supabase projesi aç, `.env` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` gir.
2. `supabase/setup.sql` dosyasını SQL Editor'da çalıştır (isteğe bağlı: ardından `supabase/seed.sql` ile içerik tablolarını temizle).
3. `admin@yeniform.com` ile giriş yapıp admin paneline gir (şifreyi `/admin/account` veya Supabase Dashboard’dan ayarlayın).

`.env` dolu olduğunda uygulama Supabase üzerinden çalışır. Vercel'de aynı değişkenleri Environment Variables bölümüne ekleyin.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Derlemeyi önizle |
| `npm run lint` | ESLint |
