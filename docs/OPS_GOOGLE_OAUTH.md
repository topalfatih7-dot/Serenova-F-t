# Google OAuth — markalama + Custom Domain (ops)

> **Kod:** İlk giriş / PKCE yarışı düzeltildi (`authSessionFromUrl`, `oauthAuth`, `AuthCallbackPage`).  
> **Bu dosya:** Google’da `….supabase.co` ve generic uygulama adı görünmesini kaldırmak için **Dashboard + DNS** adımları.

Proje ref: `rvzksmyhsgxgrxgeabmi`  
Site: `https://www.yeniform.com`  
Önerilen auth host: `https://auth.yeniform.com`

---

## Ne görünür, ne düzelir?

| Google ekranındaki metin | Kaynak | Düzeltme |
|--------------------------|--------|----------|
| Uygulama adı (ör. proje id) | Google Auth Platform → Branding | Ad: **Yeni Form** |
| Logo yok / varsayılan | Branding → App logo | `public/google-oauth-logo.png` (kare PNG) |
| `rvzksmyhsgxgrxgeabmi.supabase.co uygulamasına devam edin` | OAuth callback host = Supabase proje URL | Supabase **Custom Domain** (`auth.yeniform.com`) + env |

Site URL’i `www.yeniform.com` yapmak Google’daki **domain satırını** değiştirmez; Custom Domain gerekir ([Supabase docs](https://supabase.com/docs/guides/platform/custom-domains), [Login with Google](https://supabase.com/docs/guides/auth/social-login/auth-google)).

Custom Domain ücretli add-on’dur (Pro+).

---

## 1) Google Auth Platform — Branding (ad + logo)

1. [Google Auth Platform → Branding](https://console.cloud.google.com/auth/branding)
2. **App name:** `Yeni Form`
3. **App logo:** `public/google-oauth-logo.png` (tercihen ~120×120 PNG; Google doğrulaması birkaç iş günü sürebilir)
4. **Home page:** `https://www.yeniform.com`
5. **Privacy / Terms:** mevcut legal URL’ler (`/legal/gizlilik-politikasi`, `/legal/uyelik-ve-abonelik-sozlesmesi` vb.)
6. Kaydet. Brand verification isteğe bağlı ama önerilir.

---

## 2) Supabase Redirect URLs (www + apex)

[Authentication → URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

- **Site URL:** `https://www.yeniform.com`
- **Redirect URLs** (mutlaka ikisi de):
  - `https://www.yeniform.com/**`
  - `https://yeniform.com/**`
  - `http://localhost:5173/**`
  - `http://localhost:3000/**`

Uygulama OAuth `redirectTo` için **sekme origin’ini** kullanır (`window.location.origin`); apex/www karışıklığında PKCE verifier kaybolmasın diye.

---

## 3) Supabase Custom Domain (`auth.yeniform.com`)

1. Dashboard → [Settings → Custom Domains](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/settings/general) (veya Add-ons → Custom Domain)
2. Host: `auth.yeniform.com` (kök domain değil; subdomain)
3. DNS:
   - **CNAME** `auth` → `rvzksmyhsgxgrxgeabmi.supabase.co`
   - Doğrulama için istenen **TXT** (`_acme-challenge…`) kayıtlarını ekle
4. Verify → Activate
5. Activate sonrası Auth, OAuth callback’te custom domain’i kullanır. Eski `*.supabase.co` URL’i de çalışmaya devam eder.

CLI alternatifi: [Custom Domains guide](https://supabase.com/docs/guides/platform/custom-domains).

---

## 4) Google OAuth Client — redirect URI

[Google Auth Platform → Clients](https://console.cloud.google.com/auth/clients) → Web client:

**Authorized redirect URIs** (ikisini de tut):

- `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`
- `https://auth.yeniform.com/auth/v1/callback` ← Custom Domain aktif olduktan sonra **ekle**

**Authorized JavaScript origins** (uygulama origin’leri):

- `https://www.yeniform.com`
- `https://yeniform.com`
- Localhost geliştirme için geçici origin’ler

Supabase Dashboard → Authentication → Providers → Google: aynı Client ID / Secret.

---

## 5) Env (Custom Domain aktif olduktan sonra)

Vercel Production (+ Preview gerekirse) ve `.env.local`:

```env
VITE_SUPABASE_URL=https://auth.yeniform.com
SUPABASE_URL=https://auth.yeniform.com
```

Publishable / anon key ve service role **değişmez**. Redeploy şart.

`VITE_SITE_URL` / `APP_URL` = `https://www.yeniform.com` kalır (uygulama adresi; auth host değil).

---

## 6) Doğrulama checklist

- [ ] Google hesap seçicide uygulama adı **Yeni Form** + logo
- [ ] Domain satırı `auth.yeniform.com` (artık `….supabase.co` değil)
- [ ] Incognito: `https://yeniform.com` ve `https://www.yeniform.com` → Google giriş **ilk denemede** oturum / onboarding
- [ ] Localhost Google giriş (redirect allowlist + JS origin)

---

## İlgili kod

- `src/services/oauthAuth.js` — `redirectTo` = current origin, `nf-oauth-pending` stash
- `src/services/authSessionFromUrl.js` — PKCE single-flight
- `src/pages/auth/AuthCallbackPage.jsx` — OAuth callback + safety timeout
- `src/components/auth/AuthRedirectHandler.jsx` — kök `?code=` → `/auth/callback` + flow restore
- Logo asset: `public/google-oauth-logo.png`
