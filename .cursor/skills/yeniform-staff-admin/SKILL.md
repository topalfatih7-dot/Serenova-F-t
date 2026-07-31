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

`StaffClientProgramPage` / `CoachProgramEditor`: üstte yatay gün seçimi → kopyala/temizle → kütüphane %75 + gün akışı %25 (`lg:grid-cols-[3fr_1fr]`; mobilde alt alta) → `CoachProgramSendModal` → `buildWeeklyCoachProgramPayload` → `createProgram`. Kısıtlar: paket penceresi + `member.availability`.

## Dietitian list builder UX

`StaffClientNutritionPage` (`/staff/clients/:id/list`): page shell + `NutritionProgramBuilder`.
Zamanlama: `cycle14` | `weekly` | `date` (süresiz her gün yok). Başlık `buildNutritionProgramTitle` ile otomatik (koç programı gibi).
## Admin critical flows

- **Programs:** `AdminProgramsPage` (`/admin/programs`) — filtre, görüntüle, sil; edit → `AdminProgramEditPage` (`CoachProgramEditor` / `NutritionProgramBuilder` + `updateProgram`)
- **Premium:** `AdminPremiumPage` → `adminUpdatePremiumMembership` + `ManualSessionEditor`
- Applications: staff/corporate/contact (+ CV docs)
- Library CRUD + video upload
- Messages: staff threads, audit, collab
- Dense tables → mobile: list + detail sheet; mark desktop-heavy tools clearly

## Assignment (üye ↔ personel)

- Atama **yalnızca admin** (`AdminPremiumPage`). Koç/diyet `autoAssign` var; **doktor her zaman manuel**.
- Ücretli + eksik atama → üye dashboard “Uzmanınız atanıyor” (`memberNeedsStaffAssignment`).
- Profil uzman kartları: yalnızca pakette olan roller (`packageIncludes*`).
- Assignment bildirimi → `/profile`.
- İleri faz (claim, kuyruk, lab RLS, adherence UI, doktor nav): [`docs/STAFF_MEMBER_FLOWS_ILERI_FAZ.md`](../../../docs/STAFF_MEMBER_FLOWS_ILERI_FAZ.md)

## Related

[reference.md](reference.md) · [İleri faz akışlar](../../../docs/STAFF_MEMBER_FLOWS_ILERI_FAZ.md)
