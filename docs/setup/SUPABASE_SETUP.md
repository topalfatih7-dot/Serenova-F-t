# Yeni Form — Supabase Kurulum Rehberi

Uygulama **yalnızca Supabase** ile çalışır. `.env` dosyasında (veya Vercel Environment Variables) Supabase anahtarları tanımlı olmalıdır.

Aşağıdaki adımlar kurulumu anlatır.

---

## 1) Supabase projesi oluştur

1. https://supabase.com adresine gir, ücretsiz hesap aç.
2. **New project** → bir isim ver, güçlü bir **Database Password** belirle, bölge seç (Avrupa için *Frankfurt/EU Central* önerilir).
3. Proje hazır olunca (~1-2 dk) devam et.

## 2) API anahtarlarını al

1. Sol menüde **Project Settings** (dişli) → **API**.
2. Şu iki değeri kopyala:
   - **Project URL** → `https://xxxx.supabase.co`
   - **anon public** key → `eyJ...`

## 3) `.env` dosyasını oluştur

Proje kök klasöründe (`donusum-programi/`) `.env.example` dosyasını `.env` olarak kopyala ve doldur:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

> `.env` dosyası `.gitignore` içinde olduğu için git'e gönderilmez.

## 4) Veritabanı şemasını kur

1. Supabase Dashboard → sol menü **SQL Editor** → **New query**.
2. `supabase/setup.sql` dosyasının **tamamını** yapıştır ve **Run** ile çalıştır.
   - İdempotenttir; tablolar, RLS, RPC'ler, storage politikaları, varsayılan planlar ve admin kullanıcısını oluşturur/günceller.
   - Artımlı migration'lar için proje kökünde `npm run db:migrate` kullanılır.

## 5) Temiz başlangıç (isteğe bağlı)

1. Yeni bir SQL query aç.
2. `supabase/seed.sql` dosyasının tamamını yapıştır ve **Run** ile çalıştır.
   - Bu betik **örnek/demo verisi EKLEMEZ**; içerik tablolarını boşaltarak temiz bir başlangıç sağlar. Tekrar çalıştırmak güvenlidir.
   - Kadro (koç/diyetisyen), blog yazıları, yorumlar, SSS, başarı hikâyeleri ve hareket kütüphanesi artık **Admin panelinden** eklenir:
     - Admin → **Kadromuz** (koç/diyetisyen)
     - Admin → **Kütüphane** (hareket/egzersiz + video)
     - Admin → **Blog** (yazılar)
     - Admin → **İçerik** (yorumlar, SSS, başarı hikâyeleri + hikâye onayı)

> **Mevcut projeyi güncelliyorsan:** `supabase/migrations/` altındaki dosyalar `npm run db:migrate` ile uygulanır. Tam şema senkronu için `setup.sql` tekrar çalıştırılabilir (idempotent).

## 6) Admin hesabını oluştur

`setup.sql` admin kullanıcısını (`admin@yeniform.com`) oluşturur. Şifre kod/dokümanda tutulmaz — kurulum sonrası **Admin → Hesap Ayarları** (`/admin/account`) veya Supabase Dashboard → Authentication → Users üzerinden ayarlayın.

Giriş yapamıyorsan:

**A) Hazır SQL:** SQL Editor'da `supabase/create_admin.sql` dosyasını çalıştır (geçici bootstrap şifre içerir; hemen değiştirin).

**B) Dashboard'dan:** Supabase → **Authentication** → **Users** → **Add user** ile `admin@yeniform.com` ekle (Auto Confirm açık).

> Admin e-postasını değiştirmek istersen **şu yerler aynı olmalı**:
> 1. `src/config/brand.js` → `ADMIN_EMAIL` / `VITE_ADMIN_EMAIL`
> 2. `supabase` içindeki `is_admin()` e-posta kontrolü
> 3. Vercel `ADMIN_EMAIL` (API guard)
> 4. Migration ile canlı DB güncellemesi

## 7) E-posta onayını kapat (geliştirme için)

Geliştirme sırasında kayıt sonrası e-posta doğrulaması istemiyorsan:

- Supabase → **Authentication** → **Sign In / Providers** (veya **Settings**) → **Email** → **Confirm email** seçeneğini kapat.

> Üretimde bunu açık bırakman önerilir.

## 8) Çalıştır

```
npm install
npm run dev
```

Tarayıcı konsolunda hata yoksa uygulama artık Supabase'i kullanıyordur. Üye kaydı, giriş, premium paket, destek talepleri ve admin paneli işlemleri doğrudan Supabase'e yazılır.

---

## Mimari özet

| Tablo | İçerik |
|-------|--------|
| `members` | Üyeler (auth.users ile 1:1). Detaylar `data` JSONB içinde. |
| `staff` | Kadro / uzman ekibi (anasayfada herkese açık). |
| `programs` | Antrenman / beslenme programları. |
| `posts` | Blog yazıları. |
| `tickets` | Destek talepleri + mesajlar. |
| `activities` | Admin aktivite akışı. |
| `payments` | Ödeme kayıtları. |
| `site_content` | Yorumlar, SSS, başarı hikâyeleri. |

- Roller e-posta ile çözülür: admin (sabit e-posta) · uzman (`staff` tablosunda e-postası olan) · üye (diğer herkes).
- RLS politikaları: üyeler yalnızca kendi verisini, uzmanlar atandıkları danışanları, admin her şeyi görür/düzenler. Herkese açık içerik (kadro, blog, yorumlar) giriş yapmadan okunabilir.

## Sık karşılaşılan sorunlar

- **Giriş yapılamıyor / "Invalid login":** E-posta onayı açıksa, kayıt sonrası gelen onay e-postasındaki linke tıkla ya da 7. adımı uygula.
- **Admin paneli açılmıyor:** Giriş yapılan e-posta `is_admin()` içindeki adresle birebir aynı mı kontrol et.
- **Anasayfada kadro/yorum/SSS görünmüyor:** Bu bölümler artık temiz başlar ve içerik yoksa otomatik gizlenir. Admin → **Kadromuz** ve **İçerik** sayfalarından ekleyince görünür olurlar. RLS'in herkese açık okuma politikaları için `setup.sql` eksiksiz çalıştı mı kontrol et.
- **Veriler gelmiyor ama hata yok:** `.env` değerleri doğru mu? Değişiklikten sonra `npm run dev`'i yeniden başlat (Vite env'i başlangıçta okur).
