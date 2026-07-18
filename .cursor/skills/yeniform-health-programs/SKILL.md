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

- Hub `/health-test` → section `/health-test/:sectionId` → `/health-test/finish`
- Sections: all `general`, `medical`, `physical`, `lifestyle` + `diet_*` for every member; only `women` / `men` / `diet_women` gated by gender
- Stored in `members.data.healthTest` JSONB; analysis via `aiAnalysis.js` / sync services (full HT → radarScores + AI summaries)
- Full question catalog must live in `docs/mobile/domains/health-test-catalog.md`

## Calendar / programs

- Entries from `programs.data`; date mapping `programSchedule` / `getProgramEntriesForDate`
- Complete workout: activity toggle; meals: `toggleMealCompletion(date, mealType, entryIds)`
- Meal types: kahvaltı, ara öğünler, öğle, akşam (see `MEAL_TYPES`)

## Calorie AI

- Text: `POST /api/ai-food-text` — gated by `hasManualCalorieAccess`
- Vision: `POST /api/ai-food-vision` — gated by `hasPhotoCalorieAccess`
- Quotas / usage logs — respect API guards

## Related

[reference.md](reference.md) · `yeniform-membership-payments` for gates
