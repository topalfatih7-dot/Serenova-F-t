---
name: yeniform-health-programs
description: >-
  Handles Yeni Form health tests, calendar meal/workout completion, member
  programs, calorie AI, and water tracking. Use when working on sağlık testi,
  health-test, takvim, programlarım, öğün, antrenman tamamlama, kalori,
  ai-food-text, ai-food-vision, su takibi, water tracking, or hydration.
---

# Yeni Form Health, Programs & Calendar

## Health test (iki aşamalı)

- Hub `/health-test` → çekirdek `/health-test/core` → opsiyonel kategori `/health-test/:sectionId`
- Label: **Kişisel Sağlık Analizi**
- **Gate:** boy/kilo/doğum tarihi (+ cinsiyet) zorunlu — `HealthProfileGateForm` (inline); `hasCompleteAnalysisProfile`
- **Onay:** `healthAck` + `disclaimer` (mevcut consent)
- **1. Aşama — Genel Sağlık Testi** (`src/data/coreHealthTest.js`): kategori göstermeden 25 (erkek) / 26 (kadın) sabit soru
  - Bitince `useHealthAnalysisSync` → `POST /api/ai-health-analysis` → `healthAnalysis.analysisStage = 'core'`
- **2. Aşama — Opsiyonel kategoriler:** `general`, `medical`, `nutrition`, `physical`, `lifestyle` + `women`/`men`
  - Çekirdek sorular kategoride tekrar sorulmaz (`getRemainingSectionQuestions`); hub ile aynı sayım (serbest metin muaf)
  - Core analiz sonrası tüm opsiyonel kategoriler açık (yarıda bırakılanlar dahil “Devam et”)
  - Katı tamamlanma (`isDetailedHealthTestComplete`) → `healthTest.optionalCompletedAt` + 2. AI analizi (`analysisStage = 'detailed'`)
  - Serbest metin "İsteğe bağlı" alanları (`DETAILED_OPTIONAL_TEXT_KEYS`) detaylı tetikleyiciden ve akış sayımından muaf
- Stored in `members.data.healthTest` JSONB; analiz `members.data.healthAnalysis`
- Kan tahlili: testte “yüklemek ister misiniz?” → `yes` + dosya; üye profilde yalnızca o zaman yönetilir. `no` / `later` ise profil alanı yok.
- AI erişim: çekirdek + detaylı analiz **herkese açık**; `force` yeniden analiz yalnızca ücretli
- **14 günlük kilit (plan fark etmez):** kilit **tüm opsiyonel sorular bitince** başlar (`optionalCompletedAt`; detaylı AI henüz yoksa da). Core analiz tek başına soru kilidi başlatmaz. `fullLock` süresince tüm sorular kapalı; skorlar görünür. Süre dolunca “Testi Yeniden Çöz” → `healthTest: { retakeAt }` + `healthAnalysis` sıfırlanır (`analysisStage: 'core'`, skorlar silinir; `healthScoreHistory` kalır) → baştan çöz → **yeni analiz**. Eski skor leftover kalsa bile `retakeAt` son analizden sonraysa core yeniden üretilir. `retakeAt` kilit başlangıcından sonraysa UI/API kilit açık sayılır. Personel `force` muaf. API: `423` yalnızca `fullLock` + `stage=detailed`; aynı fingerprint `409` retake sonrası uygulanmaz (`api/ai-health-analysis.js`).
- Çıktı: 8 skor + `staffBrief` (şema aynı)
- Üye dashboard: `HealthScoreCard` (skorlar; `staffBrief` yok)
- Personel: skorlar + `staffBrief` (ücretli üyelikte)
- Program / diyet listesi AI **üretilmez**
- Fingerprint stale → personel yeniden analiz (ücretli)
- Eski `isHealthTestComplete` (zorunlu sorular) checklist/rozet/istatistik için korunur

## Calendar / programs

- Entries from `programs.data`; date mapping `programSchedule` / `getProgramEntriesForDate`
- Complete workout: activity toggle; meals: `toggleMealCompletion(date, mealType, entryIds)`
- Meal types: kahvaltı, ara öğünler, öğle, akşam (see `MEAL_TYPES`)
- Eski `ai_basic` / `ai_eko` kaynakları listelenmez (`programPackageScope`)

## Calorie AI

- Text: `POST /api/ai-food-text` — gated by `hasManualCalorieAccess`
- Vision: `POST /api/ai-food-vision` — gated by `hasPhotoCalorieAccess`
- Quotas / usage logs — respect API guards

## Water tracking

- Spec: [`docs/WATER_TRACKING.md`](../../../docs/WATER_TRACKING.md)
- Default goal 2000 ml; dietitian/admin RPC `set_member_water_goal`; member logs `member_water_logs` (ml only)
- UI: `WaterCarafeCard` (şişe dolumu) / `MemberWaterTracker` / `StaffWaterProgress` — no glass counter, no `/water` route
- Dashboard: karşılama banner’ının altı, sağlık skoru ile yan yana (grafik grid’de değil)
- Do not copy `calorieHistory` JSONB pattern

## Related

[reference.md](reference.md) · `yeniform-membership-payments` for gates
