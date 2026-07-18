# F04 — Health Test Complete

1. `/health-test` hub — progress per section; consent if required  
2. Open section `/health-test/:sectionId` — answer required questions  
   - Types: `single`, `emoji`, `multi`, `text`, `time`, `scale` (0–10), `file`  
   - Support `followUps`, `detail`, `softWarning`, exclusive multi  
3. Applicable sections depend on gender + package (`getApplicableSections`); dietitian `diet_activity` skipped when coach package  
4. Save answers into `members.data.healthTest`  
5. On full completion: hub shows **360° radarScores**; analysis sync via `memberHealthSync` / `aiAnalysis` (`HEALTH_ANALYSIS_VERSION` ≥ 7, includes `radarScores`)  
6. Lab files (optional): upload to `health-lab-results` when `bloodWorkUploadIntent=yes`  
7. Dashboard / staff can read answers; admin sees analysis + 360 dims  

Empty: incomplete badge on nav. Offline: block submit with message.
