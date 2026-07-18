# Public — Login (IMPLEMENTATION LOCK)

- **Expo:** `/(auth)/login`
- **Web:** `/login` → `src/pages/auth/LoginPage.jsx`
- **Priority:** P0
- **Skill:** `yeniform-auth-onboarding`

Bu dosya web davranışının kilididir. Ek alan / farklı redirect uydurma.

---

## Purpose

E-posta/şifre + Google (iOS’ta + Apple) ile oturum; role göre yönlendirme.

## Preconditions

Yok (public). Zaten authenticated ise otomatik redirect (aşağıda).

## Layout (mobil — zorunlu sıra)

```
[BrandLogo]
Başlık: Giriş Yap (veya web parity kısa başlık)
[Email FormField]
[Password FormField + show/hide]
[Beni hatırla checkbox]
[Turnstile / device attestation slot — production]
[Primary CTA: Giriş Yap]  // loading iken spinner, disabled
[SocialAuthButtons — Google; iOS + Apple]
Link: Şifremi unuttum → forgot-password
Link: Kayıt ol → onboarding
[FormErrorModal when error]
```

Sol marka video paneli **yalnızca tablet/desktop web**; telefonda tek sütun form (web md altı gibi).

## State

| State | Type | Default |
|-------|------|---------|
| email | string | '' |
| password | string | '' |
| showPass | bool | false |
| remember | bool | `getRememberMe()` eşdeğeri (SecureStore) |
| errors | { email?, password? } | {} |
| loading | bool | false |
| turnstileToken | string | '' |
| errorModal | { open, message } | closed |

## Validation (submit öncesi — birebir)

1. `email = sanitizeEmailInput(email)`
2. `!isValidEmailAddress(cleanEmail)` → field `email`: **Geçerli e-posta girin**
3. `password.length < 6` → field `password`: **En az 6 karakter**  
   (Not: kayıtta PASSWORD_RULES 8+; login’de web bilerek min 6 kullanıyor — **değiştirme**)
4. Field error varsa modal/toast: email hatası veya password hatası veya **Lütfen formu kontrol edin.**
5. Turnstile/attestation required ve token yok → **Bot doğrulamasını tamamlayın.**

## API — password login

```http
POST {API_BASE}/api/auth
Content-Type: application/json

{
  "action": "password-login",
  "email": "<sanitized>",
  "password": "<plain>",
  "turnstileToken": "<token or empty>"
}
```

### Success (beklenen şekil)

```json
{
  "ok": true,
  "session": {
    "access_token": "...",
    "refresh_token": "..."
  }
}
```

Sonra client: `supabase.auth.setSession({ access_token, refresh_token })`.

### Errors (mesajları koru)

| Durum | Kullanıcı mesajı |
|-------|------------------|
| 429 | API `error` veya **Çok fazla deneme. Lütfen sonra tekrar deneyin.** |
| bot/turnstile | API error metni |
| diğer fail | API error veya **E-posta veya şifre hatalı.** |
| setSession fail | **Oturum açılamadı. Lütfen tekrar deneyin.** |
| network PROD | **Giriş servisine ulaşılamadı. Sayfayı yenileyip tekrar deneyin.** |

Fail sonrası: turnstile token sıfırla + widget remount.

### Success UX

- Toast: **Hoş geldiniz!**
- Redirect sırası:
  1. `redirectTo` (nav state `from`) varsa ve `/login` ile başlamıyorsa → oraya
  2. else `role === 'admin'` → `/admin`
  3. else `role === 'staff'` → `/staff`
  4. else → `/profile`  
  (Web login success default **profile**, dashboard değil — **değiştirme**)

## Already authenticated (mount)

Aynı redirect kuralları; `from` öncelikli.

## Side effects after login (web parity — sunucu/activity)

`login()` içinde: staff list fetch, `roleForUser`, activity log, telegram notify. Mobil aynı `supabaseDb.login` eşdeğerini çağırmalı; telegram’ı client’tan atlama (servis içinde).

## Session revoked

Mount’ta `consumeSessionRevokedMessage()` varsa toast warning 7000ms.

## Nav state message

`location.state.message` varsa toast info bir kez, state’ten temizle.

## Social

- Google: `oauthAuth` flow `login`
- iOS MOBILE DIFF: Apple Sign-In ekle (store); web’de yok ama iOS zorunlu
- Callback: `auth/callback` deep link

## Remember me

`setRememberMe(remember)` — token SecureStore vs session-equivalent storage (web: local vs session). `syncAutoRefresh(remember)`.

## Acceptance

- [ ] Yukarıdaki validation mesajları birebir
- [ ] Production’da yalnızca `/api/auth` password-login
- [ ] Redirect role tablosu doğru
- [ ] Captcha yokken production submit engelli
- [ ] Başarısızda captcha reset
- [ ] Yeni alan yok
