# Yeni Form — Supabase Kurulum Rehberi

Uygulama **çift modda** çalışır:

- **Yerel mod (varsayılan):** `.env` yoksa veriler tarayıcıda (localStorage) tutulur. Hemen çalışır, kurulum gerektirmez.
- **Supabase modu:** `.env` doldurulduğunda tüm veriler Supabase'den çekilir ve oraya yazılır.

Aşağıdaki adımlar Supabase moduna geçişi anlatır.

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
2. `supabase/schema.sql` dosyasının **tamamını** yapıştır ve **Run** ile çalıştır.
   - Bu; tabloları, güvenlik kurallarını (RLS), yeni kullanıcı tetikleyicisini ve admin tanımını oluşturur.

## 5) Temiz başlangıç (seed)

1. Yeni bir SQL query aç.
2. `supabase/seed.sql` dosyasının tamamını yapıştır ve **Run** ile çalıştır.
   - Bu betik **örnek/demo verisi EKLEMEZ**; içerik tablolarını boşaltarak temiz bir başlangıç sağlar. Tekrar çalıştırmak güvenlidir.
   - Kadro (koç/diyetisyen), blog yazıları, yorumlar, SSS, başarı hikâyeleri ve hareket kütüphanesi artık **Admin panelinden** eklenir:
     - Admin → **Kadromuz** (koç/diyetisyen)
     - Admin → **Kütüphane** (hareket/egzersiz + video)
     - Admin → **Blog** (yazılar)
     - Admin → **İçerik** (yorumlar, SSS, başarı hikâyeleri + hikâye onayı)

> **Önceden kurduysan (kütüphane, üyelik talepleri, personel girişi & içerik yönetimi güncellemesi):** `supabase/schema.sql` dosyasını **tekrar** çalıştır. Bu güncelleme şunları ekler/günceller:
> - `exercises` tablosu (hareket kütüphanesi) ve `membership_requests` tablosu (admin onaylı dondurma/iptal talepleri)
> - `exercise-videos` adında herkese açık bir **Storage bucket** (admin video yükler). Bucket ve izinleri `schema.sql` içinde otomatik oluşturulur.
> - `admin_upsert_staff` / `admin_delete_staff` RPC fonksiyonları: admin koç/diyetisyen eklerken artık **giriş yapabilen bir kullanıcı (auth.users)** da otomatik oluşturulur.
> - `site_content_member_story` politikası: üyeler kendi **başarı hikâyelerini** gönderebilir (admin onayıyla yayınlanır).
>
> **Daha önce eklenmiş ama giriş yapamayan koç/diyetisyenler için:** Güncel `schema.sql` çalıştırıldıktan sonra Admin → **Kadromuz** bölümünde ilgili kişiyi düzenle, **Şifre** alanını doldurup kaydet. Bu işlem o kişi için auth kullanıcısını oluşturur ve giriş aktifleşir.

## 6) Admin hesabını oluştur

Admin, belirli bir e-posta ile kayıt olan kullanıcıdır. Varsayılan giriş bilgileri:

```
E-posta : admin@serenova.fit
Şifre   : Serenova2026!
```

Üç yol var:

**A) Hazır SQL (en kolay, önerilen):** SQL Editor'da `supabase/create_admin.sql` dosyasını çalıştır. Onaylı bir admin kullanıcı + `members` tablosunda admin satırı oluşturur; e-posta doğrulaması açık olsa bile hemen giriş yapılır.

**B) Uygulamadan kayıt:** `npm run dev` ile başlat, **Kayıt Ol** sayfasından bu e-posta ile hesap aç (e-posta onayı kapalı olmalı, bkz. 7. adım).

**C) Dashboard'dan:** Supabase → **Authentication** → **Users** → **Add user** ile `admin@serenova.fit` ekle (Auto Confirm açık).

> Admin e-postasını değiştirmek istersen **üç yerde** aynı olmalı:
> 1. `src/config/brand.js` → `ADMIN_CREDENTIALS.email`
> 2. `supabase/schema.sql` → `is_admin()` fonksiyonu içindeki adres
> 3. `supabase/schema.sql` → `handle_new_user()` fonksiyonundaki kontrol
> Değiştirdikten sonra `schema.sql`'deki ilgili fonksiyonları SQL Editor'da tekrar çalıştır.

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
- **Anasayfada kadro/yorum/SSS görünmüyor:** Bu bölümler artık temiz başlar ve içerik yoksa otomatik gizlenir. Admin → **Kadromuz** ve **İçerik** sayfalarından ekleyince görünür olurlar. RLS'in herkese açık okuma politikaları için `schema.sql` eksiksiz çalıştı mı kontrol et.
- **Veriler gelmiyor ama hata yok:** `.env` değerleri doğru mu? Değişiklikten sonra `npm run dev`'i yeniden başlat (Vite env'i başlangıçta okur).
