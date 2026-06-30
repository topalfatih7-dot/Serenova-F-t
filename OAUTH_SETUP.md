# Sosyal Giriş (Google, Apple, Facebook) Kurulumu

Uygulama kodu hazır. **"provider is not enabled"** hatası = Supabase Dashboard'da sağlayıcılar henüz açılmamış.

**Yeni Form projesi (doğrudan link):**  
https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers

**Supabase OAuth callback URL (Google/Apple/Facebook'a eklenecek):**  
`https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`

## 1) Redirect URL'leri

Supabase → **Authentication** → **URL Configuration**

| Alan | Değer |
|------|--------|
| **Site URL** | `https://www.yeniform.com` (veya geliştirme: `http://localhost:5173`) |
| **Redirect URLs** | `https://www.yeniform.com/auth/callback` |
| | `http://localhost:5173/auth/callback` |
| | Vercel preview: `https://*.vercel.app/auth/callback` |

## 2) Google

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. **OAuth 2.0 Client ID** (Web application) oluşturun
3. **Authorized redirect URI:** Supabase Dashboard → Auth → Providers → Google → gösterilen callback URL (ör. `https://xxxx.supabase.co/auth/v1/callback`)
4. Client ID ve Secret'ı Supabase Google provider alanına yapıştırın
5. **Enable Google provider** → Kaydet

## 3) Apple

1. [Apple Developer](https://developer.apple.com/) → Identifiers → Services ID
2. Sign in with Apple yapılandırın; Return URL = Supabase callback URL
3. Supabase → Auth → Providers → Apple → Services ID, Key, Team ID, Secret
4. **Enable Apple provider**

> Apple yalnızca ilk girişte ad soyad verir. Uygulama eksik ad için kayıt adımında kullanıcıdan ister.

## 4) Facebook

1. [Meta for Developers](https://developers.facebook.com/) → Uygulama → Facebook Login
2. Valid OAuth Redirect URIs = Supabase callback URL
3. App ID ve App Secret → Supabase Facebook provider
4. **Enable Facebook provider**

## 5) Uygulama akışı (eksik bilgi koruması)

| Adım | Ne olur |
|------|---------|
| Google ile kayıt | OAuth → `/auth/callback` → telefon eksikse `/onboarding?oauth=1` |
| Profil tamamlama | Ad, telefon, KVKK onayı → plan seçimi → panel |
| Google ile giriş (mevcut üye) | Doğrudan panele yönlendirme |
| E-posta kaydı | Mevcut 2 adımlı akış (değişmedi) |

**OAuth ile gelmeyen zorunlu alanlar:** telefon (randevu/hatırlatma), KVKK onayı, üyelik planı.

**Google'dan gelen:** e-posta, ad soyad (çoğu zaman), profil fotoğrafı URL (isteğe bağlı kullanılabilir).

## 6) Test

```bash
npm run dev
```

1. `/onboarding` → **Google ile devam et**
2. Dönüşten sonra telefon ekranını görün
3. Tamamlayınca dashboard'a gidin
4. Çıkış → `/login` → aynı hesapla tekrar giriş (tek tık)

## Sorun giderme

- **"provider is not enabled"** → Dashboard'da ilgili sağlayıcı kapalı veya secret hatalı
- **Redirect mismatch** → Google/Apple/Facebook'taki callback URL ile Supabase'in verdiği URL birebir aynı olmalı
- **Panele giremiyorum, onboarding'e atıyor** → Telefon veya `joinedAt` eksik; OAuth tamamlama adımını bitirin
