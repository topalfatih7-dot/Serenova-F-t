# Staff & Admin — Reference

## Staff nav source

`src/config/staffNav.js` → `staffNavForRole` / `buildStaffNavItems`  
Shell: `src/components/layout/StaffShell.jsx` → `PanelSidebar` + `TopBar` + `PanelMobileMenu`

## Admin nav source

`src/config/adminNav.js` → `ADMIN_NAV` / `buildAdminNavItems`  
(overview, members, plans, premium, programs, applications, library, staff, payments, sessions, messages, support, blog, content, analytics, ai-costs, activity, account)  
Shell: `src/components/layout/AdminShell.jsx` → `PanelSidebar` + `TopBar` + `PanelMobileMenu`

## Shared panel chrome

- `src/components/layout/PanelSidebar.jsx` — hover-expand rail (`activeVariant`: member | staff | admin)
- `src/components/layout/TopBar.jsx` — desktop sticky bar (role path props)
- `src/components/layout/PanelMobileMenu.jsx` — mobile drawer

## Key files

- `src/pages/staff/*`, `StaffClientProgramPage.jsx`, `StaffClientNutritionPage.jsx`, `StaffListsPage.jsx`, `StaffProgramEditPage.jsx`
- `src/components/staff/CoachProgramEditor.jsx`, `CoachProgramSendModal.jsx`, `CoachApplySameProgramModal.jsx`, `NutritionProgramBuilder.jsx`, `StaffHealthBrief.jsx`
- `src/utils/coachProgram.js` (`buildWeeklyCoachProgramPayload`)
- `src/pages/admin/AdminPremiumPage.jsx`, `AdminProgramsPage.jsx`, `AdminProgramEditPage.jsx`, `ManualSessionEditor.jsx`
- `src/pages/payments/PaymentManagementPage.jsx` — staff hakediş (`staff_earnings`)
- `src/services/staffAssignment.js`, `sessionAttendance.js`, `supabaseDb.adminUpdatePremiumMembership`

## Member UX tied to assignment (2026-07-31)

- `memberNeedsStaffAssignment` → `DashboardPage` sage banner (“Uzmanınız atanıyor”)
- `ProfilePage` expert cards filtered by package entitlements (hidden if role not in package)
- `NotificationsPage`: `type === 'assignment'` → `/profile`; `appointment` → `/schedule`

## Randevu onay modeli (2026-07-31)

- Üye book → `status: 'pending'` (`api/_bookSession.js`); personel onay/red → `respond-session` (`api/_respondSession.js`)
- Pending limit + slot kilitler; video yalnız `scheduled`
- Admin manuel seans → doğrudan `scheduled`
- Staff overview: “Onay bekleyen talepler” paneli

## İleri faz

Hâlâ sonraya: staff adherence, lab UI, pazarlama copy — [`docs/STAFF_MEMBER_FLOWS_ILERI_FAZ.md`](../../../docs/STAFF_MEMBER_FLOWS_ILERI_FAZ.md)
