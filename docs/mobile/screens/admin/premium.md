# Admin — Premium Yönetimi (IMPLEMENTATION LOCK)

- **Expo:** `/(admin)/premium`
- **Web:** `/admin/premium` → `AdminPremiumPage.jsx` + `EditPremiumModal` + `ManualSessionEditor`
- **Priority:** P2
- **Flow:** F13
- **API:** `adminUpdatePremiumMembership(memberId, options)`

---

## List

- **All members** (including Basic/free) — do not filter to paid-only
- Search/filter as web
- Row → open EditPremiumModal

## EditPremiumModal options (pass to adminUpdatePremium)

Documented fields used by `supabaseDb.adminUpdatePremiumMembership`:

| option | Meaning |
|--------|---------|
| membership | plan id (incl. free downgrade) |
| durationMonths | number |
| addPackage | multi-package add flag |
| extendDays | extend expiry |
| setRemainingDays | set remaining calendar days |
| premiumExpiresAt | explicit expiry |
| assignedCoachId / assignedDietitianId / assignedDoctorId | uuid or null |
| coachSessions / dietitianSessions / doctorSessions | arrays from ManualSessionEditor |
| supportSchedule | schedule object |

Free targeting: strips subscription packages; keeps active one-time doctor packages; clears membership fields per web logic. **Do not simplify away multi-package migration** (`migrateLegacyToPackages`, `resolvePackagePurchase`).

## ManualSessionEditor

Port from `src/components/admin/ManualSessionEditor.jsx` — sections gated by packageIncludesCoach/Dietitian/Doctor.

## Status

`adminSetMembershipStatus(memberId, { status, note, pauseUntil })` — separate from plan edit when web exposes it.

## Mobile UX

List → full-screen edit sheet (many fields). Do not drop assignment dropdowns.

## Errors

- Üye bulunamadı. (from API)

## Acceptance

- [ ] Lists all members  
- [ ] Free downgrade preserves one-time doctor packages  
- [ ] sanitizeStaffForPackage / assignment side effects via same server function  
- [ ] No client-only entitlement change without calling adminUpdatePremiumMembership  
