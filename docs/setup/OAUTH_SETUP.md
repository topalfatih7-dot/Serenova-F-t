# Sosyal Giriş (Google, Apple, Facebook) Kurulumu

Uygulama kodu hazır. **"provider is not enabled"** hatası = Supabase Dashboard'da sağlayıcılar henüz açılmamış.

**Yeni Form projesi (doğrudan link):**  
https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers

**Supabase OAuth callback URL (Google/Apple/Facebook'a eklenecek):**  
`https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`

## Google ekranında "yeniform.com" / "Yeni Form" görünmesi

Google giriş ekranında `rvzksmyhsgxgrxgeabmi.supabase.co uygulamasına devam edin` yazısı, OAuth yönlendirmesinin Supabase alan adı üzerinden yapılmasından kaynaklanır. Markayı düzenlemek için:

### 1) Google Cloud Console — OAuth onay ekranı

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **OAuth consent screen**
2. **User Type:** External (veya kurumsal hesabınız varsa Internal)
3. **App information:**
   - **App name:** `Yeni Form`
   - **User support email:** `info@yeniform.com` (veya aktif destek adresiniz)
   - **App logo:** `public/google-oauth-logo.png` (veya `brand-mark.png` — kare 512×512, Google min. 120×120)
4. **App domain:**
   - **Application home page:** `https://www.yeniform.com`
   - **Privacy policy:** `https://www.yeniform.com/privacy`
   - **Terms of service:** `https://www.yeniform.com/terms`
5. **Authorized domains:** `yeniform.com` ekleyin — **`supabase.co` silmeyin** (aşağıdaki sorun giderme)
6. Kaydet → **Publish app** (Production)

Bu adımlarla kullanıcı **"Yeni Form, Google Hesabınıza erişmek istiyor"** başlığını ve logoyu görür.

> **Not:** Alt satırdaki "… supabase.co uygulamasına devam edin" metni, redirect URI Supabase projesine işaret ettiği sürece Google tarafından gösterilebilir. Bunu tamamen `yeniform.com` yapmak için Supabase **Custom Auth Domain** gerekir (Pro plan): `auth.yeniform.com` → Supabase Dashboard → **Project Settings** → **Custom Domains**.

### 2) Supabase — Site URL

Supabase → **Authentication** → **URL Configuration**

| Alan | Değer |
|------|--------|
| **Site URL** | `https://www.yeniform.com` |
| **Redirect URLs** | `https://www.yeniform.com/auth/callback` |
| | `http://localhost:5173/auth/callback` |
| | Vercel preview: `https://*.vercel.app/auth/callback` |

## 1) Redirect URL'leri

(Site URL tablosu yukarıda.)

## 2) Google — Credentials

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **OAuth 2.0 Client ID** (Web application) oluşturun
3. **Authorized redirect URI:** Supabase Dashboard → Auth → Providers → Google → gösterilen callback URL (ör. `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`)
4. Client ID ve Secret'ı Supabase Google provider alanına yapıştırın
5. **Enable Google provider** → Kaydet

## 3) Apple

Detaylı adımlar: **[APPLE_SETUP.md](./APPLE_SETUP.md)** (ertelendi — Apple Developer kurulumu bekleniyor)

Kısa özet:
1. [Apple Developer](https://developer.apple.com/) → App ID + Services ID + Signing Key (.p8)
2. Return URL = Supabase callback URL
3. Supabase → Auth → Providers → Apple → Services ID, Key ID, Team ID, Secret (JWT)
4. **Enable Apple provider**

> Apple web OAuth'ta ad soyad genelde gelmez; onboarding adımında istenir. Secret 6 ayda bir yenilenmelidir.

## 4) Facebook

Detaylı adımlar: **[FACEBOOK_SETUP.md](./FACEBOOK_SETUP.md)**

Kısa özet:
1. [Meta for Developers](https://developers.facebook.com/) → Uygulama oluştur → Facebook Login ekle
2. **Valid OAuth Redirect URIs** = `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`
3. **Use cases** → `public_profile` + **`email`** (zorunlu)
4. App ID ve App Secret → Supabase → Auth → Providers → Facebook
5. **Enable Facebook provider**

> Development modunda yalnızca uygulama rolü olan hesaplar giriş yapabilir. Canlı için Live moda geçin.

## 5) Uygulama akışı (eksik bilgi koruması)

| Adım | Ne olur |
|------|---------|
| Google ile kayıt | OAuth → `/auth/callback` → telefon + **cinsiyet** eksikse `/onboarding?oauth=1` |
| Facebook ile kayıt | Aynı akış (kurulum: `FACEBOOK_SETUP.md`) |
| Apple ile kayıt | Aynı akış (Dashboard kurulumu: `APPLE_SETUP.md`) |
| Profil tamamlama | Ad, telefon, **cinsiyet (Kadın/Erkek)**, KVKK onayı → plan seçimi → panel |
| Sosyal giriş (mevcut üye) | Doğrudan panele yönlendirme |
| E-posta kaydı | Mevcut 2 adımlı akış (değişmedi) |

**OAuth ile gelmeyen zorunlu alanlar:** telefon, **cinsiyet**, KVKK onayı, üyelik planı.

**Google'dan gelen:** e-posta, ad soyad (çoğu zaman), profil fotoğrafı URL (isteğe bağlı kullanılabilir).

**Facebook'dan gelen:** e-posta (izin gerekir), ad soyad, profil fotoğrafı URL (çoğu zaman).

## 6) Test

```bash
npm run dev
```

1. `/onboarding` → **Google** veya **Facebook ile devam et**
2. Dönüşten sonra telefon + cinsiyet ekranını görün
3. Tamamlayınca dashboard'a gidin
4. Çıkış → `/login` → aynı hesapla tekrar giriş (tek tık)

## Sorun giderme

- **"provider is not enabled"** → Dashboard'da ilgili sağlayıcı kapalı veya secret hatalı
- **Redirect mismatch** → Google/Apple/Facebook'taki callback URL ile Supabase'in verdiği URL birebir aynı olmalı
- **Panele giremiyorum, onboarding'e atıyor** → Telefon, cinsiyet veya `joinedAt` eksik; OAuth tamamlama adımını bitirin
- **Google'da hâlâ supabase.co yazıyor** → OAuth consent screen adını/logo/domain'i kontrol edin; tamamen kaldırmak için Supabase Custom Auth Domain kurun
- **"This domain is used by these client URIs… Client credentials must be updated before deleting"** → OAuth consent screen'den bir domain (genelde `supabase.co`) silmeye çalışıyorsunuz; fakat **Credentials → OAuth 2.0 Client ID** içinde hâlâ o domain'e ait **Authorized redirect URI** var (ör. `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`). **Çözüm:** Domain'i silmeyin — `yeniform.com` ekleyip `supabase.co`'yu listede bırakın. Supabase Custom Auth Domain kurduktan sonra önce Client'taki redirect URI'yi `https://auth.yeniform.com/auth/v1/callback` olarak güncelleyin, Supabase'te test edin, ancak ondan sonra `supabase.co`'yu authorized domains'den kaldırın.
