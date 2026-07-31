# Health / Programs — Reference

## Key files

- `src/data/coreHealthTest.js` — çekirdek 25/26 soru, `isCoreHealthTestComplete`
- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
  - `getRemainingSectionQuestions`, `isDetailedHealthTestComplete`, `getRemainingHubSections`
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx` (`core` + `remaining` modları)
- `src/components/onboarding/HealthProfileGateForm.jsx` — boy/kilo/yaş gate
- `src/components/onboarding/HealthTestHub.jsx`, `HealthTestFlow.jsx` (`mode: core|remaining`)
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- `src/utils/programSchedule.js`, `programPackageScope.js`, `healthProfile.js`
- `src/services/healthScoreAnalysis.js` — skor meta, fingerprint, `analysisStage`, AI fetch, fallback
- `src/hooks/useHealthAnalysisSync.js` — core + detailed iki aşamalı tetik
- `src/hooks/useStaffHealthAnalysisRerun.js` — personel rerun (yalnızca stale / ilk eksik)
- `src/components/dashboard/HealthScoreCard.jsx` — üye panel genel /100 + 8 boyut
- `src/components/staff/StaffHealthBrief.jsx` — personel skor + brief + stale UI (güncelken buton yok)
- `api/ai-health-analysis.js`, `api/_healthScoreAnalysis.js`, `api/_ai-prompts.js` (HEALTH_SCORE_*)
- `api/ai-food-text.js`, `api/ai-food-vision.js`

## Visibility

- Üye dashboard: skorlar (`HealthScoreCard`); `staffBrief` yok.
- Personel sağlık profili: cevaplar + klinik notlar + `StaffHealthBrief` (skor + brief).
- Env: `OPENAI_HEALTH_MODEL=gpt-5.4` (varsayılan).
