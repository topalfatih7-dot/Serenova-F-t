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

- `src/pages/staff/*`, `StaffClientProgramPage.jsx`, `StaffClientNutritionPage.jsx`, `StaffListsPage.jsx`
- `src/components/staff/CoachProgramSendModal.jsx`, `CoachApplySameProgramModal.jsx`, `NutritionProgramBuilder.jsx`
- `src/utils/coachProgram.js` (`buildWeeklyCoachProgramPayload`)
- `src/pages/admin/AdminPremiumPage.jsx`, `ManualSessionEditor.jsx`
- `src/services/staffAssignment.js`, `supabaseDb.adminUpdatePremiumMembership`
