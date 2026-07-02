# Apple Sign In — Kurulum Rehberi (ertelendi)

> **Durum:** ⬜ Beklemede — kod hazır; Apple Developer + Supabase Dashboard kurulumu yapılacak.  
> **İlgili kod:** `src/services/oauthAuth.js`, `src/components/auth/SocialAuthButtons.jsx`  
> **Genel OAuth:** [OAUTH_SETUP.md](./OAUTH_SETUP.md)  
> **Supabase doküman:** [Login with Apple](https://supabase.com/docs/guides/auth/social-login/auth-apple)

---

## Özet

Yeni Form bir **web SPA** (Vite + React). Apple tarafında **web OAuth akışı** kullanılır; native iOS uygulaması yok.

```
Kullanıcı → Apple ile devam et
         → Apple giriş ekranı
         → Supabase: https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback
         → Yeni Form: /auth/callback?flow=login|signup&code=...
         → Yeni kullanıcı: /onboarding?oauth=1
         → Mevcut üye: /profile
```

**Kod durumu:** Apple butonu ve OAuth akışı Google ile aynı altyapıyı kullanır. Dashboard kurulumu tamamlanınca büyük olasılıkla ek kod gerekmez.

---

## Ön koşullar

| Gereksinim | Not |
|------------|-----|
| Apple Developer Program | Yıllık ~99 USD |
| Admin / Account Holder yetkisi | Identifiers, Keys bölümleri |
| Supabase Dashboard erişimi | [Auth Providers](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/providers) |

---

## Adım 1 — App ID (Bundle ID)

1. [Apple Developer → Identifiers → App IDs](https://developer.apple.com/account/resources/identifiers/list) → **+**
2. Önerilen identifier: `com.yeniform.web` (onayınıza göre değiştirilebilir)
3. **Sign in with Apple** capability → açık
4. Server-to-Server notification endpoint → **boş bırakın** (Supabase desteklemiyor)

---

## Adım 2 — Services ID (web OAuth — zorunlu)

1. [Identifiers → Services IDs](https://developer.apple.com/account/resources/identifiers/list/serviceId) → **+**
2. Önerilen: `com.yeniform.web.service`
3. **Sign in with Apple** → Configure:
   - **Primary App ID:** Adım 1'deki App ID
   - **Domains:** `rvzksmyhsgxgrxgeabmi.supabase.co`
   - **Return URLs:**  
     `https://rvzksmyhsgxgrxgeabmi.supabase.co/auth/v1/callback`

---

## Adım 3 — Signing Key (.p8)

1. [Keys](https://developer.apple.com/account/resources/authkeys/list) → **+** → **Sign in with Apple**
2. `.p8` dosyasını indirin — **yalnızca bir kez** indirilebilir; güvenli saklayın
3. **Key ID**'yi not edin (10 karakter)

---

## Adım 4 — Secret Key (JWT) üretimi

Team ID + Key ID + Services ID + `.p8` ile **ES256 JWT** üretilir.

- Supabase Dashboard → Auth → Apple → secret generator aracı (Chrome/Firefox; Safari'de sorun çıkabilir)
- Veya [Supabase Apple dokümanındaki](https://supabase.com/docs/guides/auth/social-login/auth-apple) araç

**Kritik:** Secret en fazla **6 ay** geçerlidir. Süresi dolunca Apple girişi durur → takvime 6 aylık yenileme hatırlatması ekleyin.

---

## Adım 5 — Supabase Dashboard

### URL Configuration

| Alan | Değer |
|------|--------|
| Site URL | `https://www.yeniform.com` |
| Redirect URLs | `https://www.yeniform.com/auth/callback` |
| | `http://localhost:5173/auth/callback` |
| | `https://*.vercel.app/auth/callback` |

### Apple Provider

| Alan | Değer |
|------|--------|
| Enable Sign in with Apple | Açık |
| Client ID | Services ID (örn. `com.yeniform.web.service`) |
| Secret Key | Üretilen JWT |
| Key ID | Apple Keys |
| Team ID | Developer hesabı (sağ üst, 10 karakter) |

---

## Adım 6 — Hide My Email (önerilen)

Apple kullanıcıları `@privaterelay.appleid.com` adresi verebilir. Uygulama bunu kabul eder.

İsteğe bağlı — relay e-posta iletimi için:
- Apple Developer → **Sign in with Apple for Email Communication**
- `yeniform.com` domain doğrulaması (TXT kaydı)

---

## Apple'a özel davranışlar

| Konu | Davranış | Uygulama |
|------|----------|----------|
| Ad soyad | Web OAuth'ta genelde gelmez | Onboarding adımında kullanıcıdan istenir ✓ |
| E-posta | İlk girişte gelir; sonrakilerde eksik olabilir | Oturum + onboarding akışı |
| Gizli e-posta | `@privaterelay.appleid.com` | Kabul edilmeli |
| Secret rotasyonu | 6 ayda bir | Operasyonel görev |

---

## Kurulum öncesi karar listesi (sizden)

- [ ] Apple Developer hesabı var mı?
- [ ] Bundle ID onayı: `com.yeniform.web` uygun mu?
- [ ] Services ID onayı: `com.yeniform.web.service` uygun mu?
- [ ] Canlı domain: `www.yeniform.com` mu?
- [ ] İleride native iOS uygulaması planlanıyor mu?
- [ ] `.p8` dosyası güvenli kanaldan paylaşılacak mı?

---

## Kurulum sonrası test checklist

```bash
npm run dev
```

1. `/onboarding` → **Apple ile devam et**
2. Apple giriş → `/onboarding?oauth=1` (yeni kullanıcı)
3. Ad, telefon, KVKK, paket seçimi → kayıt tamamlansın
4. Çıkış → `/login` → Apple ile tekrar giriş → `/profile`
5. Hide My Email ile test (mümkünse)

---

## Sorun giderme

| Belirti | Olası neden |
|---------|-------------|
| `provider is not enabled` | Supabase'te Apple kapalı veya secret hatalı |
| Redirect mismatch | Services ID Return URL ≠ Supabase callback |
| Giriş 6 ay sonra durdu | JWT secret süresi doldu — yenileyin |
| Onboarding'e atıyor | Kayıt tamamlanmamış; telefon/plan eksik |

---

## Kurulum tamamlanınca (geliştirici)

- [ ] Supabase provider doğrulama
- [ ] Uçtan uca kayıt + giriş testi
- [ ] `OAUTH_SETUP.md` Apple bölümü güncel mi kontrol
- [ ] (Opsiyonel) 6 aylık secret yenileme runbook'u
