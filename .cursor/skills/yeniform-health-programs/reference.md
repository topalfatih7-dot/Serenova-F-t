# Health / Programs — Reference

## Key files

- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- `src/utils/programSchedule.js`, `programPackageScope.js`
- `src/services/healthScoreAnalysis.js` — skor meta, fingerprint, AI fetch, fallback
- `src/hooks/useHealthAnalysisSync.js` — üye ilk otomatik tetik
- `src/hooks/useStaffHealthAnalysisRerun.js` — personel force rerun
- `src/components/staff/StaffHealthBrief.jsx` — staff-only skor + brief + stale UI
- `api/ai-health-analysis.js`, `api/_healthScoreAnalysis.js`, `api/_ai-prompts.js` (HEALTH_SCORE_*)
- `api/ai-food-text.js`, `api/ai-food-vision.js`

## Staff visibility

Staff health profile: answers + clinical notes; `healthAnalysis` brief → `StaffHealthBrief`.
Üye skor/brief görmez. Env: `OPENAI_HEALTH_MODEL=gpt-5.4` (varsayılan).
