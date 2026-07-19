# Member — health-test-finish

- **Expo:** `/(member)/health/test/finish`
- **Web:** `/health-test/finish` → redirects to hub (`HealthTestFinishPage.jsx`)
- **Priority:** P1

## Purpose

Bitir ve sync; 360 skor hub üzerinde gösterilir.

## Preconditions

Authenticated member + ProfileCompletionGate passed. Apply plan gates where noted in domains/membership-entitlements.md.

## Layout

1. Prefer hub completion state (web): progress + **360° Sağlık Analizi** (`HealthRadarScores`)
2. Mobile finish may mirror hub summary: overall + 7 boyut çubukları
3. Sticky CTA if needed (dashboard’a dön)

## Data

- `members.data.healthTest`
- `healthAnalysis.radarScores`: metabolic, nutrition, activity, sleep, stress, digestion, lifestyle, overall
- Lab paths: `healthTest.bloodWorkFiles[]` → storage `health-lab-results`

## Key interactions

finish sync; show radar when complete

## Plan gates

See membership-entitlements + feature-specific skills (calorie, library full access).

## Empty / loading / error / offline

- Loading: skeleton/spinner
- Empty: incomplete sections CTA
- Error: retry
- Offline: banner; disable mutating actions

## Native

File picker for lab PDF/photo when upload intent = yes. Camera optional.

## Acceptance

- [ ] Parity with web primary actions
- [ ] Gates enforced
- [ ] 360 scores render when test complete
- [ ] No crash on empty datasets
