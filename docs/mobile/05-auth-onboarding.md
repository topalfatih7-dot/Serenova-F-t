# 05 — Auth & Onboarding

## Roller

`member` | `staff` (coach|dietitian|doctor) | `admin`

## Login

**Web route:** `/login`  
**Expo:** `/(auth)/login`

### Alanlar

| Alan | Tip | Zorunlu |
|------|-----|---------|
| email | email | evet |
| password | secure text | evet |
| rememberMe | bool | hayır |
| turnstile/captcha | token | production evet |

### Aksiyon

`POST /api/auth` `{ action: "password-login", email, password, turnstileToken, … }`

Başarı → role redirect: admin `/admin`, staff `/staff`, member registered → dashboard, else onboarding.

Hata örnekleri: yanlış şifre, rate limit, disposable email, captcha fail.

### Sosyal

Web: Google only. Mobil iOS: **Apple Sign-In zorunlu** (+ Google opsiyonel). OAuth deep link → callback → `completeOAuthMember` / onboarding `oauth=1`.

## Password reset

1. Forgot: email → `password-reset` API  
2. Mail link → Auth callback → Reset password screen  
3. Yeni şifre: `PASSWORD_RULES` (aşağıda)

## Password rules

- En az 8 karakter  
- Bir küçük harf  
- Bir büyük harf  
- Bir rakam  
- Bir özel karakter  

## ProfileCompletionGate

`hasRegisteredMember(user) === false` ve role member → zorunlu onboarding. Auth session var ama members yok → normal (ödeme bekleniyor).

## Onboarding

**Steps:** `Hesap` → `Üyelik`

### Step 0 — Hesap

| Alan | Not |
|------|-----|
| name | Ad Soyad |
| email | OAuth değilse; sanitize |
| phone + phoneCountry | PhoneField |
| gender | GenderSelect |
| password / confirmPassword | OAuth değilse |
| legal consents | KVKK vb. checkbox |

OAuth: bağlı e-posta bandı; şifre alanları gizli.

### Step 1 — Üyelik

- Plan kartları: free, eko, diyet, spor, doktor, vip  
- DurationPicker 1/3/6 (doktor hariç)  
- Turnstile  
- free → `register`  
- paid → IAP (mobil) / Stripe (web) → webhook members  

Query: `?plan=vip`, `?oauth=1`.

## Staff force password

`staff.data.tempPasswordIssued` → tam ekran şifre değişimi; shell kilitli.

## Mobil bot koruması

Web Turnstile. Mobil seçenekler (raporda tercih):  
1) Apple/Google native captcha / App Attest + Play Integrity sinyali API’ye  
2) API rate limit + device attestation header  
Production’da anonymous brute-force’a açık raw password endpoint kullanma.

## İlgili akışlar

- [flows/F01-register-pay-member.md](flows/F01-register-pay-member.md)  
- [flows/F02-oauth-complete-profile.md](flows/F02-oauth-complete-profile.md)  
- [flows/F03-password-reset.md](flows/F03-password-reset.md)  
- [flows/F10-staff-force-password.md](flows/F10-staff-force-password.md)  
