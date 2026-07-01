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
**[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

Özetle:
1. Supabase projesi aç, `.env` dosyasına `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` gir.
2. `supabase/setup.sql` dosyasını SQL Editor'da çalıştır (isteğe bağlı: ardından `supabase/seed.sql` ile içerik tablolarını temizle).
3. `admin@serenova.fit` ile kayıt olup admin paneline gir.

`.env` dolu olduğunda uygulama Supabase üzerinden çalışır. Vercel'de aynı değişkenleri Environment Variables bölümüne ekleyin.

## Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Üretim derlemesi |
| `npm run preview` | Derlemeyi önizle |
| `npm run lint` | ESLint |
