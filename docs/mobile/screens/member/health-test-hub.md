# Member — health-test-hub

- **Expo:** `/(member)/health/test/hub`
- **Web:** `/health-test` → `HealthTestPage.jsx`
- **Priority:** P1

## Purpose

Bölüm kartları ve ilerleme

## Preconditions

Authenticated member + ProfileCompletionGate passed. Apply plan gates where noted in domains/membership-entitlements.md.

## Layout

1. PanelPageHeader (title + optional photo)
2. Overall progress + section cards
3. When fully complete: 360° `HealthRadarScores` (7 dims + overall)
4. Empty / error states

## Data

- `healthTest` in members.data
- `healthAnalysis.radarScores` (or client `calculateRadarScores`)

## Key interactions

navigate section; view 360 scores when complete

## Plan gates

See membership-entitlements + feature-specific skills (calorie, library full access).

## Empty / loading / error / offline

- Loading: skeleton/spinner
- Empty: explanatory copy + CTA
- Error: retry
- Offline: banner; disable mutating actions

## Native

Permissions as needed (camera for calorie vision; mic/camera for call).

## Acceptance

- [ ] Parity with web primary actions
- [ ] Gates enforced
- [ ] No crash on empty datasets
