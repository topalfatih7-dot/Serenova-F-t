# Member — Health Test Hub (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/health-test`
- **Web:** `/health-test` → `HealthTestPage.jsx` + `HealthTestHub`
- **Priority:** P1
- **Flow:** F04
- **Catalog:** `domains/health-test-catalog.md`

---

## Early exits

- No user → login  
- `isFreeTrialExpired` → `FreeTrialExpiredGate` only  

## Header

- title: **Sağlık Testleri**
- subtitle if needs consent (`!healthAck || !disclaimer`):  
  **Testlere başlamadan önce onayları işaretleyin**  
- else:  
  **Her kategoriyi ayrı ayrı tamamlayın — istediğiniz sırayla ilerleyebilirsiniz**

## Consent

Props to hub: `healthAck`, `disclaimer`.  
On save: `updateProfile({ healthAck, disclaimer })`  
Toast: **Onaylar kaydedildi. Testlere başlayabilirsiniz.**

## Hub props (pass-through)

```
gender, packageConfig, healthTest, healthAck, disclaimer,
onConsentSave, consentSaving, profile, healthAnalysis
```

Section cards from `getApplicableSections(gender, packageConfig)` — **all sections for everyone**; only gender-only sections filtered. **Do not hardcode section list**; use healthTest.js logic.

Navigate → `/health-test/{sectionId}`.

## Finish

When all required complete → `/health-test/finish`.

## Acceptance

- [ ] Consent gate before tests  
- [ ] Subtitles exact  
- [ ] Sections respect gender only (not package)  

