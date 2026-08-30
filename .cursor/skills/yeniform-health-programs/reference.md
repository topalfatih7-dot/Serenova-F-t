# Health / Programs — Reference

## Key files

- `src/data/coreHealthTest.js` — çekirdek 25/26 soru, `isCoreHealthTestComplete`
- `src/data/healthTest.js`, `healthTestSections.js`, `healthTestDietitianSections.js`
  - `getRemainingSectionQuestions`, `isDetailedHealthTestComplete`, `getRemainingHubSections`
  - Hub + akış sayımı aynı: core keys + `DETAILED_OPTIONAL_TEXT_KEYS` dışarı
- `src/pages/HealthTestPage.jsx`, `HealthTestSectionPage.jsx` (`core` + `remaining` modları)
- `src/components/onboarding/HealthProfileGateForm.jsx` — boy/kilo/yaş gate
- `src/components/onboarding/HealthTestHub.jsx`, `HealthTestFlow.jsx` (`mode: core|remaining`)
- `src/pages/CalendarPage.jsx`, `ProgramsPage.jsx`, `CalorieCalculatorPage.jsx`
- `src/components/water/WaterCarafeCard.jsx`, `MemberWaterTracker.jsx`, `StaffWaterProgress.jsx`
- `src/utils/waterTracking.js`, `src/services/waterLogs.js`, `src/hooks/useWaterLogs.js`
- `docs/WATER_TRACKING.md`
- `src/utils/programSchedule.js`, `programPackageScope.js`, `healthProfile.js`
- `src/services/healthScoreAnalysis.js` — skor meta, fingerprint (`stripHealthTestMeta`), AI fetch, fallback
- `src/utils/healthTestLock.js` — 14 gün kilit, `getHealthTestLockState`, `retakeAt` yeni döngü
- `src/hooks/useHealthAnalysisSync.js` — core + detailed iki aşamalı tetik; `optionalCompletedAt` persist
- `src/hooks/useStaffHealthAnalysisRerun.js` — personel rerun (yalnızca stale / ilk eksik)
- `src/components/dashboard/HealthScoreCard.jsx` — üye panel genel /100 + 8 boyut
- `src/components/staff/StaffHealthBrief.jsx` — personel skor + brief + stale UI (güncelken buton yok)
- `api/ai-health-analysis.js`, `api/_healthScoreAnalysis.js`, `api/_ai-prompts.js` (HEALTH_SCORE_*)
- `api/ai-food-text.js`, `api/ai-food-vision.js`

## Lock rules

- Core analiz sonrası opsiyonel kategoriler açık (started / partial kilit yok)
- `isDetailedHealthTestComplete` → `healthTest.optionalCompletedAt` + 14 gün `fullLock` (+ detailed AI)
- Retake: `healthTest: { retakeAt }` + analiz sıfırlanır (`buildRetakeHealthAnalysisReset`); eski skor leftover ise `needsCoreAnalysisAfterRetake` core’u yeniden üretir

## Visibility

- Üye dashboard: skorlar (`HealthScoreCard`); `staffBrief` yok.
- Personel sağlık profili: cevaplar + klinik notlar + `StaffHealthBrief` (skor + brief).
- Kan tahlili: `bloodWorkUploadIntent === 'yes'` ise üye profilde yönetilir (`HealthLabFilesPanel`); `no` / `later` / yoksa profil alanı açılmaz. Personel yalnızca dosya varsa görür. 14 gün kilit yüklemeyi engellemez.
- Env: `OPENAI_HEALTH_MODEL=gpt-5.4` (varsayılan).
