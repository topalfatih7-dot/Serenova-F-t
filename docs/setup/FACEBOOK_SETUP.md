# Facebook Login — Kurulum Rehberi

> **Durum:** ⬜ Beklemede — kod hazır; Meta Developer + Supabase Dashboard kurulumu yapılacak.  
> **İlgili kod:** `src/services/oauthAuth.js`, `src/components/auth/SocialAuthButtons.jsx`  
> **Genel OAuth:** [OAUTH_SETUP.md](./OAUTH_SETUP.md)  
> **Supabase doküman:** [Login with Facebook](https://supabase.com/docs/guides/auth/social-login/auth-facebook)

---

## Özet

Yeni Form bir **web SPA** (Vite + React). Facebook tarafında **web OAuth akışı** kullanılır.

```
Kullanıcı → Facebook ile devam et
         → Facebook giriş ekranı
         → Supabase: https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback
         → Yeni Form: /auth/callback?flow=login|signup&code=...
         → Yeni kullanıcı: /onboarding?oauth=1
         → Mevcut üye: /profile
```

**Kod durumu:** Facebook butonu ve OAuth akışı Google ile aynı altyapıyı kullanır. Dashboard kurulumu tamamlanınca ek kod gerekmez.

---

## Ön koşullar

| Gereksinim | Not |
|------------|-----|
| Meta for Developers hesabı | [developers.facebook.com](https://developers.facebook.com/) |
| Facebook hesabı (yönetici) | Uygulama oluşturmak için |
| Supabase Dashboard erişimi | [Auth Providers](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers) |
| Gizlilik politikası URL | `https://www.yeniform.com/privacy` (canlıda erişilebilir olmalı) |

---

## Adım 1 — Meta uygulaması oluşturma

1. [Meta for Developers](https://developers.facebook.com/) → **My Apps** → **Create App**
2. **Use case:** "Authenticate and request data from users with Facebook Login" (veya "Other" → sonra Facebook Login ekleyin)
3. **App name:** `Yeni Form`
4. **App contact email:** `info@yeniform.com` (veya aktif destek adresiniz)
5. **Create App**

---

## Adım 2 — Facebook Login ürünü

1. Sol menü → **Add Product** (veya uygulama oluştururken eklenmiş olabilir)
2. **Facebook Login** → **Set Up**
3. Platform: **Web** seçin
4. **Site URL:** `https://www.yeniform.com` (geliştirme için `http://localhost:5173` de eklenebilir)

### Valid OAuth Redirect URIs (kritik)

Sol menü → **Facebook Login** → **Settings**:

| Alan | Değer |
|------|--------|
| Valid OAuth Redirect URIs | `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback` |

**Kaydet** — URL birebir aynı olmalı (sonunda `/` yok, typo yok).

---

## Adım 3 — E-posta izni (zorunlu)

Supabase Auth için Facebook'un **email** döndürmesi gerekir. Bu adım atlanırsa giriş başarısız olabilir veya profil eksik kalır.

1. Sol menü → **Use cases** (veya **App Review** → **Permissions and Features**)
2. **Authentication and Account Creation** → **Edit** (veya **Customize**)
3. Şunların **Ready for testing** olduğundan emin olun:
   - `public_profile`
   - `email`
4. `email` listede yoksa **Add** ile ekleyin

---

## Adım 4 — Temel uygulama ayarları

Sol menü → **Settings** → **Basic**:

| Alan | Değer |
|------|--------|
| App Domains | `yeniform.com` |
| Privacy Policy URL | `https://www.yeniform.com/privacy` |
| Terms of Service URL | `https://www.yeniform.com/terms` (önerilir) |
| App Icon | `public/brand-mark.png` (kare, min. 1024×1024 önerilir) |
| Category | Health & Fitness veya uygun kategori |

**App ID** ve **App Secret** bu sayfada — Adım 6 için not edin.  
App Secret için **Show** → kopyalayın.

---

## Adım 5 — Supabase Dashboard

### URL Configuration

[Authentication → URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

| Alan | Değer |
|------|--------|
| Site URL | `https://www.yeniform.com` |
| Redirect URLs | `https://www.yeniform.com/auth/callback` |
| | `http://localhost:5173/auth/callback` |
| | `https://*.vercel.app/auth/callback` |

(Google kurulumunda bunlar zaten varsa dokunmayın.)

### Facebook Provider

[Authentication → Providers → Facebook](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers)

| Alan | Değer |
|------|--------|
| Enable Sign in with Facebook | Açık |
| Client ID | Meta App ID |
| Client Secret | Meta App Secret |
| **Kaydet** | |

---

## Adım 6 — Geliştirme modu ve test kullanıcıları

Yeni Meta uygulamaları **Development** modunda başlar. Bu modda yalnızca uygulama rolü olan hesaplar giriş yapabilir.

### Test için (henüz canlıya almadan)

1. Meta Developer → uygulamanız → **App roles** → **Roles**
2. Kendinizi **Administrator** veya **Developer** olarak ekleyin (genelde otomatik)
3. Başka test hesapları için **Test users** veya **Tester** rolü ekleyin
4. Davet kabul edilmeli (Facebook bildirimleri)

### Canlıya almak (herkese açık)

1. **Settings → Basic** — tüm zorunlu alanlar dolu
2. **Use cases** — `email` izni onaylı / hazır
3. Sol üstte uygulama modu: **Development** → **Live** (toggle)
4. Gerekirse **App Review** — `email` izni için inceleme (çoğu wellness uygulaması için standart akış)

> İlk aşamada Development modu + kendi Facebook hesabınızla test yeterlidir.

---

## Facebook'a özel davranışlar

| Konu | Davranış | Uygulama |
|------|----------|----------|
| Ad soyad | Genelde gelir | Onboarding'de doğrulanır |
| E-posta | İzin gerekir; bazı hesaplarda eksik olabilir | Use cases'te `email` zorunlu |
| Profil fotoğrafı | `public_profile` ile URL gelebilir | İsteğe bağlı kullanılabilir |
| Development modu | Sadece rolü olanlar giriş yapar | Test kullanıcısı ekleyin |

---

## Kurulum öncesi karar listesi (sizden)

- [ ] Meta Developer hesabı var mı?
- [ ] Uygulama adı: `Yeni Form` uygun mu?
- [ ] Gizlilik politikası `https://www.yeniform.com/privacy` canlıda erişilebilir mi?
- [ ] İlk test kendi Facebook hesabınızla mı yapılacak?

---

## Kurulum sonrası test checklist

```bash
npm run dev
```

1. `/onboarding` → **Facebook ile devam et**
2. Facebook giriş → `/onboarding?oauth=1` (yeni kullanıcı)
3. Ad, telefon, cinsiyet, KVKK, paket seçimi → kayıt tamamlansın
4. Çıkış → `/login` → Facebook ile tekrar giriş → `/profile`

---

## Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| `provider is not enabled` | Supabase'te Facebook kapalı veya secret hatalı |
| Redirect URI mismatch | Meta'daki URI ≠ Supabase callback (birebir kontrol) |
| "App not setup" / giriş yok | Development modu; kullanıcıya tester rolü verilmemiş |
| E-posta gelmiyor | Use cases'te `email` izni eksik |
| Onboarding'e atıyor | Kayıt tamamlanmamış; telefon/cinsiyet/plan eksik |

---

## Kurulum tamamlanınca (geliştirici)

- [ ] Supabase Facebook provider doğrulama
- [ ] Uçtan uca kayıt + giriş testi
- [ ] `OAUTH_SETUP.md` Facebook bölümü güncel mi kontrol
- [ ] Canlıya geçiş: Development → Live + gerekirse App Review
