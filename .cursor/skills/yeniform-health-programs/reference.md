# Health / Programs — Reference

## Key files

- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- `src/utils/programSchedule.js`, `programPackageScope.js`
- `src/services/aiAnalysis.js`, `memberHealthSync.js`, `healthScoreAnalysis.js`
- `src/hooks/useHealthAnalysisSync.js` — auto score after HT (no manual refresh UI)
- `api/ai-food-text.js`, `api/ai-food-vision.js`
- AI Basic/Eko programs: `api/_aiEkoPrograms.js`, `api/_coaching/*` → skill `yeniform-ai-coaching`

## Staff visibility

Staff health profile: answers + clinical notes; **no** full `healthAnalysis` UI (`showHealthAnalysis={false}`). Admin sees analysis.
