# Domain — Programs Model (LOCK)

## Constants (birebir)

```js
CYCLE_PLAN_LENGTH = 14

MEAL_TYPES = [
  { id: 'breakfast', label: 'Kahvaltı', short: 'Kahvaltı' },
  { id: 'snack_morning', label: 'Sabah–Öğle Arası Ara Öğün', short: 'Sabah Ara' },
  { id: 'lunch', label: 'Öğle Yemeği', short: 'Öğle' },
  { id: 'snack_afternoon', label: 'Öğle–Akşam Arası Ara Öğün', short: 'Öğle Ara' },
  { id: 'dinner', label: 'Akşam Yemeği', short: 'Akşam' },
  { id: 'snack_evening', label: 'Akşam Sonrası Ara Öğün', short: 'Gece Ara' },
  { id: 'note', label: 'Dikkat / Not', short: 'Not' },
]
```

Legacy: `mealType === 'snack'` → `snack_morning`.

## Completion keys

```js
completionKey(dateStr, entryId) = `${dateStr}_${entryId}`
mealCompletionKey(dateStr, mealType) = `${dateStr}_meal_${mealType}`
```

`user.completedActivities` shape:

```json
{
  "2026-07-18": ["2026-07-18_e123", "2026-07-18_meal_breakfast"]
}
```

## splitEntriesByType

- workout: `programType === 'workout' && !mealType`
- nutrition: `programType === 'nutrition' || mealType`

## Toggle algorithms (AppContext — kopyala)

### toggleActivityCompletion(dateStr, entryId)

Toggle `completionKey` in `completedActivities[dateStr]`; recompute progress via `buildProgressPatch`; `patchCurrentRemote({ completedActivities, ...progressPatch })`.

### toggleMealCompletion(dateStr, mealType, entryIds)

- mealKey = mealCompletionKey
- if meal done: remove mealKey + all entryKeys
- else: add mealKey + all entryKeys (Set unique)
- same progress patch

## isMealCompleted

true if mealKey in dayKeys OR every entry has completionKey.

## amountText

- duration: `${amount} ${durationUnit || 'sn'}`
- else: `${amount} tekrar`

## Schedule grouping (ProgramsPage)

Filters: `all` | `workout` | `nutrition` labels: Tümü / Antrenman / Beslenme.

groupKey: cycle:N | date:YYYY-MM-DD | day:weekday | other  
Labels: `Gün N+1 / len`, formatted date TR, weekday name, `Diğer`  
Daily fixed: `Günlük menü (her gün aynı)` / `Günlük antrenman (her gün aynı)`

## Port rule

Copy `src/utils/programSchedule.js` logic into mobile shared module — do not re-derive formulas.
