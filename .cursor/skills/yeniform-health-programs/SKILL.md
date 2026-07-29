---
name: yeniform-health-programs
description: >-
  Handles Yeni Form health tests, calendar meal/workout completion, member
  programs, and calorie AI. Use when working on sağlık testi, health-test,
  takvim, programlarım, öğün, antrenman tamamlama, kalori, ai-food-text, or
  ai-food-vision.
---

# Yeni Form Health, Programs & Calendar

## Health test

- Hub `/health-test` → section `/health-test/:sectionId` (label: **Kişisel Sağlık Analizi**)
- Sections (6): `general`, `medical`, `nutrition`, `physical`, `lifestyle` + `women`/`men` by gender
- Stored in `members.data.healthTest` JSONB
- HT + onaylar tamamlanınca `useHealthAnalysisSync` → `POST /api/ai-health-analysis` (GPT-5.4)
  - Çıktı: 8 skor + `staffBrief` → `members.data.healthAnalysis` (üyeye skor/brief **gösterilmez**)
  - Program / diyet listesi AI **üretilmez**
  - Fingerprint stale → personel “Güncel değil” + yeniden analiz
- Programlar personel (koç/diyetisyen) tarafından gönderilir

## Calendar / programs

- Entries from `programs.data`; date mapping `programSchedule` / `getProgramEntriesForDate`
- Complete workout: activity toggle; meals: `toggleMealCompletion(date, mealType, entryIds)`
- Meal types: kahvaltı, ara öğünler, öğle, akşam (see `MEAL_TYPES`)
- Eski `ai_basic` / `ai_eko` kaynakları listelenmez (`programPackageScope`)

## Calorie AI

- Text: `POST /api/ai-food-text` — gated by `hasManualCalorieAccess`
- Vision: `POST /api/ai-food-vision` — gated by `hasPhotoCalorieAccess`
- Quotas / usage logs — respect API guards

## Related

[reference.md](reference.md) · `yeniform-membership-payments` for gates
