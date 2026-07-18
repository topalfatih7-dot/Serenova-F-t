# Member — Health Test Finish (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test/finish`
- **Web:** `/health-test/finish` → `HealthTestFinishPage.jsx`
- **Priority:** P1

## Behavior

- Sync profile / run analysis via web’s finish path (`memberHealthSync` / `aiAnalysis` triggers as in page)
- Consent already on hub — do not re-ask unless web does
- Success → navigate dashboard or hub with toast (copy from web page strings — read file at implement)
- Staff sees answers later; analysis visibility: admin yes, staff no (`showHealthAnalysis={false}`)

## Acceptance

- [ ] Matches HealthTestFinishPage side effects  
- [ ] No duplicate consent UX if hub already saved  
