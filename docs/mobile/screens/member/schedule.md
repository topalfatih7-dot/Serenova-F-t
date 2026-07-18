# Member — Schedule / Appointments (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/schedule`
- **Web:** `/schedule?tab=` → `AppointmentsPage.jsx` + `MemberScheduleView`
- **Priority:** P1
- **Flow:** F06

---

## Tabs (yalnızca bunlar)

| id | label | icon meaning |
|----|-------|----------------|
| coach | Koç | Dumbbell |
| dietitian | Diyetisyen | Apple |
| doctor | Doktor | Stethoscope |

Default tab if missing/invalid: **coach**.  
Set via `setSearchParams({ tab: id }, { replace: true })`.

Redirects (web App.jsx): `/schedule/coach|dietitian|doctor` → `?tab=`.

## Per-tab props (birebir)

### coach
- title: **Koç Randevuları**
- subtitle: **Birebir antrenman görüşmeleriniz**
- sessions: `coachSessions`
- canBook: `packageIncludesCoach(packageConfig)`
- monthlyLimit: `coachMonthlyLimit(packageConfig)`
- lockedTitle: **Koç randevuları paketinizde yok**
- lockedDescription: **Birebir koç görüşmeleri için koç içeren bir pakete geçin.**

### dietitian
- title: **Diyetisyen Randevuları**
- subtitle: **Beslenme rehberliği — tıbbi tedavi değildir**
- canBook: `packageIncludesDietitian(packageConfig)`
- monthlyLimit: `dietitianMonthlyLimit(packageConfig)`
- lockedTitle: **Diyetisyen randevuları paketinizde yok**
- lockedDescription: **Beslenme rehberliği için diyetisyen içeren bir pakete geçin.**

### doctor
- title: **Doktor Randevuları**
- subtitle: **Online sağlık görüşmeleriniz**
- canBook: `packageIncludesDoctor(packageConfig)`
- monthlyLimit: **1** (sabit)
- lockedTitle: **Doktor randevuları paketinizde yok**
- lockedDescription: **Online doktor görüşmesi için Doktor Paketi veya VIP pakete geçin.**

## MemberScheduleView behavior

Port from `src/components/calendar/MemberScheduleView.jsx` — booking, join window, cancel/reschedule if present.  
Join → `memberCallPath(type, sessionId)` = `/call/{type}/{id}`.

Join window config (`videoCall.js`):
- `joinMinutesBefore` default **15**
- `joinMinutesAfter` default **30**

## Booking API

See [contracts/api-book-session.md](../../contracts/api-book-session.md) — body, errors, UI strings for MemberScheduleView.

## Acceptance

- [ ] Tab labels/locked strings exact  
- [ ] doctor monthlyLimit = 1  
- [ ] Package include helpers from membershipPlans  
- [ ] Join path pattern exact  
