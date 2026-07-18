# F01 — Register → Pay → Member Created

## Actors

Yeni kullanıcı (member)

## Happy path

1. Landing / Membership → Onboarding (`?plan=` optional)  
2. Step 0: name, email, phone, gender, password, legal OK  
3. Step 1: select plan + duration  
4. **Mobil:** RevenueCat purchase (paid) OR register free  
   **Web parity:** Stripe Checkout for paid  
5. Auth user exists (`ensureAuthForRegistration` / signup API)  
6. Webhook (Stripe or RevenueCat) creates/updates `members` row with membership + packageConfig + expiry  
7. Client hydrate → `hasRegisteredMember` true → Dashboard  

## Failure branches

| Failure | UX |
|---------|-----|
| Validation step 0 | Inline errors, stay step 0 |
| Captcha fail | “Bot doğrulaması gerekli” |
| Payment cancel | Auth may exist; gate → onboarding; retry pay |
| Webhook delay | Polling/refresh; “Ödemeniz işleniyor” |
| Disposable email | API error message |

## DB writes

- `auth.users`  
- `members` (id = auth uid): email, name, phone, membership, data.packageConfig, …  
- `payments` row (Stripe/IAP metadata)  

## Acceptance

- [ ] Paid feature locked until membership row reflects plan  
- [ ] No fake display name in chrome before registration complete  
- [ ] Free path never opens IAP  
