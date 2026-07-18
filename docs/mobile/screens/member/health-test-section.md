# Member — Health Test Section (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test/[sectionId]`
- **Web:** `/health-test/:sectionId` → `HealthTestSectionPage.jsx` + `HealthTestFlow`
- **Priority:** P1

---

## Data

- Load questions: `getSectionQuestions(sectionId, gender, packageConfig)` from web `healthTest.js`
- Persist answers into `user.healthTest[sectionId]` (shape used by web — copy save path from HealthTestSectionPage / hub save helpers)
- Use intermediate save that **does not** full `reloadRemote` if web uses lightweight patch (`updateHealthTestPartial` / equivalent in AppContext)

## Question types to support (from catalog)

`emoji | single | multi | text | time | scale | file` (+ engine extras: detail, followUps, softWarning, exclusive multi — see catalog header).  
**Options arrays:** [domains/health-test-options.md](../../domains/health-test-options.md).  
**Lab uploads:** private bucket `health-lab-results`, path `{userId}/…` via web `uploadHealthLabResult` parity.

## Navigation

- Back → hub  
- Complete section → hub or next incomplete  
- Invalid sectionId → hub  

## Acceptance

- [ ] required fields enforced per question.required  
- [ ] No invented options  
- [ ] gender-gated sections (women/men)  
