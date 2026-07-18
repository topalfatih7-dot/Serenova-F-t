# Member — health-test-section

- **Expo:** `/(member)/health/test/section`
- **Web:** `/health-test/:sectionId` → `HealthTestSectionPage.jsx`
- **Priority:** P1

## Purpose

Soru formu

## Preconditions

Authenticated member + ProfileCompletionGate passed. Apply plan gates where noted in domains/membership-entitlements.md.

## Layout

1. PanelPageHeader (title + optional photo)
2. Primary content list/form
3. Sticky CTA if needed
4. Empty / error states

## Data

Section questions from catalog — types: emoji, single, multi, text, time, scale, file; followUps/detail/softWarning

## Key interactions

save answers; conditional follow-ups

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
