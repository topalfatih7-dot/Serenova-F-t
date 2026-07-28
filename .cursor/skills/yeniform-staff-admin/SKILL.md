---
name: yeniform-staff-admin
description: >-
  Handles Yeni Form staff (coach/dietitian/doctor) and admin panels. Use when
  working on staff panel, koç program builder, diyetisyen listeler, danışanlar,
  admin premium, başvurular, seanslar, or admin CRUD operations.
---

# Yeni Form Staff & Admin

## Staff roles

| Role | Extra nav | Core tools |
|------|-----------|------------|
| coach | Programs, Library, Collab | Haftalık gün şablonu → send modal (`scheduleType: weekly`) |
| dietitian | Lists (not programs/library), Collab | Full-page nutrition list builder |
| doctor | Base + messages | Clients, health notes, calls |

Force password when `tempPasswordIssued`. Clients via `getStaffClients()` (assignment + package).

## Coach program builder UX

`StaffClientProgramPage`: müsait gün kartları → `dayCarts` / `daySessionTimes` → library → kopyala / tüm günlere aynı program modal → `CoachProgramSendModal` → `buildWeeklyCoachProgramPayload` → `createProgram`. Kısıtlar: paket penceresi + `member.availability`.

## Dietitian list builder UX

`StaffClientNutritionPage` (`/staff/clients/:id/list`): page shell + `NutritionProgramBuilder` (scheduleMode logic unchanged).
## Admin critical flows

- **Programs:** `AdminProgramsPage` (`/admin/programs`) — filtre, görüntüle, sil; edit → `AdminProgramEditPage` (`CoachProgramEditor` / `NutritionProgramBuilder` + `updateProgram`)
- **Premium:** `AdminPremiumPage` → `adminUpdatePremiumMembership` + `ManualSessionEditor`
- Applications: staff/corporate/contact (+ CV docs)
- Library CRUD + video upload
- Messages: staff threads, audit, collab
- Dense tables → mobile: list + detail sheet; mark desktop-heavy tools clearly

## Related

[reference.md](reference.md)
