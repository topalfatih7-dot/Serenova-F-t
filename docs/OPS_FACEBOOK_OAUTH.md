# Facebook OAuth — Meta + Supabase (ops)

> **Kod:** `oauthAuth` (`facebook` provider), `SocialAuthButtons`, ortak callback / `completeOAuthMember`.  
> **Bu dosya:** Meta Developer + Supabase Providers Dashboard adımları.  
> Resmi: [Supabase Login with Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook).

Proje ref: `rvzksmyhsgxgrxgeabmi`  
Site: `https://www.yeniform.com`  
Supabase callback: `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`  
(Custom Domain aktifse ekle: `https://auth.yeniform.com/auth/v1/callback`)

**Login için ayrı Consumer / Facebook Login odaklı app kullan.** Aynı Meta hesabındaki diğer Business ürünleriyle karıştırma.

Client ID / Secret **yalnızca** Supabase Dashboard → Providers. `.env` / Vercel’e Facebook secret koyma.

---

## A) Meta Developer — yeni app

1. [developers.facebook.com](https://developers.facebook.com) → giriş
2. **My Apps → Create App**
3. Kullanım: **Authenticate and request data from users with Facebook Login** (Consumer / Login odaklı). Login dışında ürün ekleme.
4. App adı: **Yeni Form** · Contact email: `info@yeniform.com` (veya resmi mail)

---

## B) Facebook Login + redirect URI

1. **Add Product → Facebook Login → Setup** (web)
2. Quickstart’ı atla → **Facebook Login → Settings**
3. **Valid OAuth Redirect URIs** (hepsini ekle):

   - `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`
   - (Custom Domain sonra) `https://auth.yeniform.com/auth/v1/callback`

   Bu URI uygulama origin’i değil; Facebook → Supabase Auth köprüsü. Uygulama dönüşü: `{origin}/auth/callback?flow=…` (Supabase Redirect allowlist — Google ile aynı, [`OPS_GOOGLE_OAUTH.md`](OPS_GOOGLE_OAUTH.md) §2).

4. **Save Changes**

---

## C) Email izni (zorunlu)

Supabase e-posta ister; `email` yoksa oturum/profil yarım kalır.

1. **Use Cases → Authentication and Account Creation → Edit**
2. `public_profile` ve **`email`** listede ve **Ready for testing**
3. `email` yoksa **Add**

Uygulama `scopes: email,public_profile` gönderir (`oauthAuth.js`).

---

## D) Settings → Basic (Live + marka)

Facebook giriş ekranındaki logo **Meta App Icon**’dan gelir (uygulama kodundan değil). React / varsayılan ikon görünüyorsa App Icon eksik veya yanlış yüklenmiştir.

| Alan | Değer |
|------|--------|
| App ID / App Secret | → Supabase Providers |
| **Display Name** | `Yeni Form` |
| App Domains | `yeniform.com` (www yazma) |
| Privacy Policy URL | `https://www.yeniform.com/legal/gizlilik-politikasi` |
| Terms of Service URL | `https://www.yeniform.com/legal/uyelik-ve-abonelik-sozlesmesi` |
| Category | Health/Fitness veya uygun |
| **App Icon** | `public/facebook-oauth-logo.png` (1024×1024 PNG) |

### App Icon yükleme (React logosunu kaldırmak)

1. Repodaki dosya: [`public/facebook-oauth-logo.png`](../public/facebook-oauth-logo.png)  
   Canlı URL (deploy sonrası): `https://www.yeniform.com/facebook-oauth-logo.png`
2. [Meta Developers → App → Settings → Basic](https://developers.facebook.com/apps/)
3. **App Icon** → Upload → `facebook-oauth-logo.png` seç → **Save Changes**
4. Gerekirse birkaç dakika bekle; gizli pencerede Facebook Login’i tekrar dene

**+ Add Platform → Website** → Site URL: `https://www.yeniform.com`

Meta sık sorar: **Data Deletion Instructions URL** — gizlilik politikası veya hesap silme talimatı sayfası (Live engeli olabilir).

---

## E) Development vs Live

- **Development:** Yalnızca **Administrators / Developers / Testers** (App Roles) veya Test Users giriş yapabilir.
- Live öncesi: Development’ta uçtan uca smoke test.
- **Live:** Herkese açık Login. `email` + `public_profile` genelde Advanced App Review istemez; Privacy/Terms/Domain eksikse Live kilitlenir.

---

## F) Supabase Providers

1. [Authentication → Providers → Facebook](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers)
2. **Enable Facebook** = ON
3. Client ID = Meta App ID · Client Secret = Meta App Secret
4. Callback URL = Meta Valid OAuth Redirect URIs ile birebir
5. Save

---

## G) Supabase URL Configuration (doğrula)

[URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

- Site URL: `https://www.yeniform.com`
- Redirect: `https://www.yeniform.com/**`, `https://yeniform.com/**`, `http://localhost:5173/**`, `http://localhost:3000/**`

---

## H) Hesap birleştirme

Aynı e-posta önce Google/e-posta ile kayıtlıysa Facebook ikinci kimlik veya “email already registered” verebilir. Bu fazda otomatik merge yok; kullanıcıya mevcut yöntemle giriş söylemek yeterli.

---

## I) Doğrulama checklist

- [ ] Meta: Valid OAuth Redirect = Supabase callback
- [ ] Meta: `email` + `public_profile` Use Case’te
- [ ] Meta: **App Icon** = `facebook-oauth-logo.png` (React / varsayılan ikon yok)
- [ ] Meta: Display Name = **Yeni Form**
- [ ] Supabase Facebook Enabled + ID/Secret
- [ ] Development: LoginPage → Facebook → callback → profile veya onboarding
- [ ] Development: Onboarding “Facebook ile devam et” → `?oauth=1` → telefon/cinsiyet → profile
- [ ] Incognito www + apex
- [ ] Live moda alınca rastgele FB hesabı smoke
- [ ] E-posta vermeyen FB hesabı: hata mesajı anlaşılır mı?

---

## İlgili kod / asset

- `public/facebook-oauth-logo.png` — Meta App Icon (1024×1024)
- `src/services/oauthAuth.js` — `google` + `facebook`, `redirectTo` = current origin
- `src/components/auth/SocialAuthButtons.jsx` — Google + Facebook butonları
- `src/pages/auth/AuthCallbackPage.jsx` — ortak OAuth callback
- `src/pages/OnboardingPage.jsx` — `completeOAuthMember` + `?oauth=1`
- `src/utils/memberProfile.js` — `isSocialAuthUser` (`facebook` dahil)
- Google marka / custom domain: [`OPS_GOOGLE_OAUTH.md`](OPS_GOOGLE_OAUTH.md)
