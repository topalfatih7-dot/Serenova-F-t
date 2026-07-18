# Staff — Nutrition Lists (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/lists`
- **Web:** `/staff/lists` → `StaffListsPage.jsx` + `NutritionProgramBuilder`
- **Priority:** P1
- **Flow:** F12
- **Role:** dietitian (coach uses programs)

---

## MEAL_TYPES

Use exact ids/labels from `domains/programs-model.md`. Builder: meal slot + **Öğün içeriği** text field (web NutritionProgramBuilder).

## Rules

- Package windows / date range same as coach (`programPackageScope`)
- Create nutrition `programs` type via createProgram parity
- Redirect: coach hitting lists or dietitian hitting library — `StaffLibraryGate` behavior

## Acceptance

- [ ] Meal type ids exact (incl. snack_evening, note)  
- [ ] No workout cart on this screen  
- [ ] Member calendar sees meal groups after send  
