# Member — Profile (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/profile`
- **Web:** `/profile` → `ProfilePage.jsx`
- **Priority:** P0

---

## Sections (order — web)

1. Cover photo (mobile yoga / desktop salon from `PANEL_IMAGES` — use mobile cover on phone)
2. Avatar / name / MembershipBadge / status
3. Expert cards (only assigned):
   - Koç → `/schedule?tab=coach`
   - Diyetisyen → `/schedule?tab=dietitian`
   - Doktor → `/schedule?tab=doctor`
   - Show name or empty state as web
4. Active packages summary (`migrateLegacyToPackages` + `isPackageEntryActive`)
5. `PersonalInfoSection` / edit modal fields: name, email, phone, city, district, photo
6. `HealthSummarySection`
7. `VerificationSection` (email/phone verify actions)
8. Settings (notifications etc. via `updateSettings`)
9. Links: calendar, programs, payments, membership
10. Logout (`loggingOut` spinner parity)

## Edit save

`updateProfile(form)` → toast **Profil güncellendi**

## Payment return toast (IAP/Stripe return)

**Ödeme alındı! Planınız birkaç saniye içinde güncellenecek.**

## Free trial

`FreeTrialExpiredProfileAlert` when applicable.

## Do not

- Show staff email/phone from public team rules on member profile experts (names only as web)
- Invent settings keys

## Acceptance

- [ ] Expert card routes exact  
- [ ] Toast strings exact  
- [ ] Package migration helpers used  
- [ ] Logout loading state  
