# Staff & Admin — Reference

## Staff nav source

`src/components/layout/StaffShell.jsx` → `staffNavForRole`

## Admin nav source

`src/components/layout/AdminShell.jsx` → `adminNav` (overview, members, plans, premium, applications, library, staff, payments, sessions, messages, support, blog, content, analytics, ai-costs, activity, account)

## Key files

- `src/pages/staff/*`, `StaffClientProgramPage.jsx`, `StaffClientNutritionPage.jsx`, `StaffListsPage.jsx`
- `src/components/staff/CoachProgramSendModal.jsx`, `CoachApplySameProgramModal.jsx`, `NutritionProgramBuilder.jsx`
- `src/utils/coachProgram.js` (`buildWeeklyCoachProgramPayload`)
- `src/pages/admin/AdminPremiumPage.jsx`, `ManualSessionEditor.jsx`
- `src/services/staffAssignment.js`, `supabaseDb.adminUpdatePremiumMembership`
