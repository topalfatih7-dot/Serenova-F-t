# Public — Onboarding (IMPLEMENTATION LOCK)

- **Expo:** `/(auth)/onboarding`
- **Web:** `/onboarding` → `src/pages/OnboardingPage.jsx`
- **Priority:** P0
- **Flows:** F01, F02, F15
- **Skill:** `yeniform-auth-onboarding` + `yeniform-membership-payments`

---

## Modes

| Koşul | UI |
|-------|-----|
| `hasRegisteredMember(user)` && !oauth | **PlanChangeView** (yeni hesap yok) — ayrı bölüm |
| else | Stepper kayıt: Hesap → Üyelik |

Query params:

| Param | Davranış |
|-------|----------|
| `plan` | `resolvePlanFromQuery`: legacy map gumus→eko, altin→doktor, platinum→vip, premium→vip, kurucu→doktor; değilse PLAN_IDS veya `free` |
| `months` | 1\|3\|6 ise duration; yoksa recommended plan ise `RECOMMENDED_DURATION_MONTHS` (6), else 1 |
| `oauth=1` | OAuth partial profile |
| `payment=cancelled` | Toast info (aşağıdaki metinler) |

---

## STEPS (sabit)

```js
const STEPS = ['Hesap', 'Üyelik']
```

Başka adım **ekleme**.

---

## Form state (`data`)

| Field | Notes |
|-------|-------|
| name | trim zorunlu |
| email | OAuth değilse; sanitize |
| phone | national number |
| phoneCountry | DEFAULT_COUNTRY_ISO |
| gender | member gender: kadın/erkek (`isValidMemberGender`) |
| password / confirmPassword | OAuth değilse |
| membership | plan id |
| turnstileToken | non-OAuth |

Profile build (`buildProfile`):

```js
{
  name: trim,
  email: sanitized (OAuth: user/auth email),
  phone: toE164(phoneCountry, phone),
  phoneCountry,
  gender,
  password: OAuth ? undefined : password,
  turnstileToken: OAuth ? undefined : token,
  fitnessLevel: 'beginner',  // sabit
  goals: [],                 // sabit boş
  nutritionPrefs: [],        // sabit boş
}
```

Bu sabitleri UI’da sorma.

---

## Step 0 — Hesap — validation messages (birebir)

| Koşul | Mesaj |
|-------|-------|
| !name.trim | Ad soyad alanını doldurun. |
| !OAuth && invalid email | Geçerli bir e-posta adresi girin (ör. ad@site.com). |
| invalid phone | Geçerli bir cep telefonu numarası girin. |
| invalid gender | Cinsiyet seçimi zorunludur — Kadın veya Erkek seçin. |
| !OAuth && !password rules | Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir. |
| !OAuth && password mismatch | Şifreler eşleşmiyor — iki alanı da aynı yazın. |
| !termsAccepted | Devam etmek için kullanım koşullarını ve gizlilik politikasını kabul etmelisiniz. |

Field-level:

- email hint: Geçerli bir e-posta adresi girin (ör. ad@site.com)
- phone: Geçerli bir cep telefonu numarası girin
- gender: Kadın veya Erkek seçin
- password: Şifre gereksinimleri karşılanmıyor
- confirm: Şifreler eşleşmiyor

OAuth error banner: **Lütfen ad soyad ve telefon numaranızı kontrol edin; koşulları kabul ettiğinizden emin olun.**

---

## Step 1 — Üyelik

- Plans: `sortPlansForDisplay(plans from DB || ALL_PLANS)`
- `MembershipPlanCard` select → membership id
- `MembershipDurationPicker` unless doktor one-time rules (web component davranışı)
- Step1 validation: `!membership` → **Kayıt için bir üyelik planı seçin.**

Turnstile (non-OAuth, enabled): yoksa **Bot doğrulamasını tamamlayın.**

---

## Submit paths

### A) Free (`!isPaidMembership`)

1. Turnstile check  
2. `persistRegistration('free')`:
   - OAuth → `completeOAuthMember(profile, 'free', null, {})`
   - else → `register(profile, 'free')`
3. Success → WelcomeSuccessModal (`welcomePaid=false`)  
4. Fail → reset captcha; **Kayıt tamamlanamadı.** veya API error

### B) Paid — WEB parity Stripe

Web bugün:

1. `ensureAuthForRegistration(profile)` (non-OAuth)  
2. `savePendingRegistrationMetadata(profile, membership, durationMonths)`  
3. `startStripeCheckout(membership, 'register', durationMonths, email)` → redirect  

`pending_registration` user metadata **birebir**:

```json
{
  "pending_registration": {
    "name": "",
    "phone": "",
    "phoneCountry": "",
    "gender": "",
    "membership": "vip",
    "durationMonths": 3,
    "fitnessLevel": "beginner",
    "savedAt": "<ISO>"
  }
}
```

Stripe disabled: `STRIPE_REQUIRED_MESSAGE` (config’ten — uydurma).

### B′) Paid — MOBILE DIFF (zorunlu)

Stripe Checkout yerine:

1. Aynı `ensureAuthForRegistration` + `savePendingRegistrationMetadata`  
2. RevenueCat purchase `yf_{plan}_{months}m`  
3. Webhook üyeyi oluşturur (Stripe webhook parity)  
4. Poll/refresh until `hasRegisteredMember`  
5. Welcome modal  

IAP cancel: toast benzeri **Ödeme iptal edildi…** (query `payment=cancelled` metni):  
**Ödeme iptal edildi. Ücretsiz üye olarak devam edebilir veya tekrar deneyebilirsiniz.**

---

## PlanChangeView (mevcut üye)

- Başlık: **Üyelik Planını Değiştir**  
- Alt: **Mevcut hesabınızın planını güncelleyin — yeni hesap oluşturulmaz.**  
- Paid change web: Stripe `flow: 'change'`  
- Free change: `changePlan(selected, 0, durationMonths)` → toast **Planınız güncellendi.** → `/profile`  
- Current plan CTA disabled: **Zaten bu plandasınız**  
- Cancel: **Vazgeç** → profile  
- `payment=cancelled`: **Ödeme iptal edildi. Planınız değişmedi.**

Mobile paid change: IAP product change / purchase + webhook (F15).

---

## Legal

`LegalConsentCheckbox` — terms + privacy; metin web bileşeninden kopyala, kısaltarak uydurma.

---

## Acceptance

- [ ] STEPS yalnızca Hesap / Üyelik  
- [ ] buildProfile sabitleri (fitnessLevel beginner, boş arrays)  
- [ ] Validation mesajları birebir  
- [ ] pending_registration shape birebir  
- [ ] Free vs paid path ayrımı  
- [ ] Mobile paid = IAP not Stripe redirect  
- [ ] Existing member → PlanChangeView  
- [ ] Legacy plan query map  
