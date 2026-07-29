# Health / Programs — Reference

## Key files

- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx`, `HealthTestFinishPage.jsx`
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- `src/utils/programSchedule.js`, `programPackageScope.js`
- `src/services/healthScoreAnalysis.js` — skor meta, fingerprint, AI fetch, fallback
- `src/hooks/useHealthAnalysisSync.js` — üye ilk otomatik tetik
- `src/hooks/useStaffHealthAnalysisRerun.js` — personel rerun (yalnızca stale / ilk eksik)
- `src/components/dashboard/HealthScoreCard.jsx` — üye panel genel /100 + 8 boyut
- `src/components/staff/StaffHealthBrief.jsx` — personel skor + brief + stale UI (güncelken buton yok)
- `api/ai-health-analysis.js`, `api/_healthScoreAnalysis.js`, `api/_ai-prompts.js` (HEALTH_SCORE_*)
- `api/ai-food-text.js`, `api/ai-food-vision.js`

## Visibility

- Üye dashboard: skorlar (`HealthScoreCard`); `staffBrief` yok.
- Personel sağlık profili: cevaplar + klinik notlar + `StaffHealthBrief` (skor + brief).
- Env: `OPENAI_HEALTH_MODEL=gpt-5.4` (varsayılan).
