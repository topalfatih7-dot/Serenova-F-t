---
name: yeniform-ai-coaching
description: >-
  Handles Yeni Form Basic/Eko AI coach + dietitian program generation:
  Coaching Engine workouts, Mifflin macros, food_dictionary meals, safety gates,
  and OpenAI prompt contracts. Use when working on AI program, AI diyet,
  _aiBasicPrograms, _aiEkoPrograms, _coaching, eko-renew, or program-basic/eko.
---

# Yeni Form AI Koç + Diyetisyen

## Architecture (do not invert)

1. **Safety** — `api/_coaching/safetyGate.js` + `risk.js` (ED/BMI/gebelik/diyabet)
2. **Macros** — `estimateDailyCalories` (Mifflin–St Jeor) in `api/_aiBasicPrograms.js` — LLM never invents BMR/TDEE/P/F/C
3. **Workout** — deterministic `runCoachingEngine` (`api/_coaching/*`) from `exercises` table
4. **Foods** — `loadFoodAllowlist` from `food_dictionary` → `ALLOWED_FOODS` in prompt
5. **LLM** — GPT-4.1 titles + meal text only (`api/_ai-prompts.js`)
6. **Guard** — `nutritionGuard.js` allergy swap + kcal ±10–15% + protein floor
7. **Persist** — `programs` + `coachingState` + notifications

## Product windows

| Source | Diet | Workout |
|--------|------|---------|
| `ai_basic` | trial → `freeTrialExpiresAt` (same-daily meals) | same window |
| `ai_eko` | 15 days, **7-day meal rotation** (`cycleSameDaily: false`) | 30 days |

Triggers: health-test complete → `memberHealthSync`; Eko upgrade / Stripe / cron `eko-renew`; admin force.

## Hard rules

- LLM **must not** pick `exerciseId`s or recompute macros
- Deficit blocked if BMI &lt; 18.5 or ED signals; floor kcal ≥ max(BMR, 1200♀/1500♂)
- Protein 1.6–2.4 g/kg; fat ≥ 0.6 g/kg
- Referral / high risk: no failure training; RIR 2–4
- Dashboard has **no** manual “Skoru yenile” — health score syncs after HT only

## Key files

See [reference.md](reference.md)
