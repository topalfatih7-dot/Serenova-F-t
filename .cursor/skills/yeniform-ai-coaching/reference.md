# AI Coaching — Reference

## Entry / orchestration

- `api/ai-nutrition-tips.js` — tasks: `basic-programs`, `eko-programs`, `eko-programs-admin`, `health-score`
- `api/_aiEkoPrograms.js` — `generateBasicPrograms`, `generateEkoPrograms`, `runEkoRenewBatch`, `loadExerciseCandidates`
- `api/_aiBasicPrograms.js` — calories, validation, hydrate, insert helpers
- `src/services/memberHealthSync.js` — client trigger after HT / package change
- `src/services/aiBasicPrograms.js` — client fetch (55s timeout)

## Coaching engine

- `api/_coaching/index.js` — `runCoachingEngine`
- `profile.js`, `goals.js`, `split.js`, `volume.js`, `intensity.js`, `progression.js`, `adaptation.js`, `exercises.js`, `risk.js`, `workout.js`
- `nutritionConstraints.js` — prompt block P/F/C + allergy
- `nutritionGuard.js` — post-LLM meal fix
- `foodCatalog.js` — `food_dictionary` allowlist
- `safetyGate.js` — deficit / ED / pregnancy language gates
- `observability.js` — `coachingState` persist + decision log

## Prompts / model

- `api/_ai-prompts.js` — `BASIC_PROGRAM_*`, `EKO_PROGRAM_*`
- `api/_openai.js` — `getOpenAiProgramModel()` default `gpt-4.1`

## Database

- `exercises` — workout candidates + hydrate
- `programs` — `data.source` `ai_basic` | `ai_eko`; `nutritionGuard`, `coaching` meta
- `members.data` — `healthTest`, `healthAnalysis`, `availability`, `coachingState`, `completedActivities`
- `food_dictionary` — macros (`protein_g`, `fat_g`, `carb_g`) + `tags` (migration `20260723_food_dictionary_macros.sql`)
- `ai_usage_logs` — endpoints `program-basic` / `program-eko`

## Calorie formula (code)

```
BMR = Mifflin–St Jeor
TDEE = BMR × activity (HT activityFrequency or fitnessLevel)
Fat loss: TDEE × 0.825 (unless safety blocks)
Surplus: TDEE × 1.08
Floor: max(BMR, 1200 female / 1500 male)
```
