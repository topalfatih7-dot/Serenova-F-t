# Member — Calendar (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/calendar`
- **Web:** `/calendar` → `CalendarPage.jsx`
- **Priority:** P0
- **Domain:** `domains/programs-model.md`
- **Flow:** F05

---

## Purpose

Aylık takvimde programlı günler; seçili günde antrenman + öğün tamamlama; video önizleme; müsaitlik düzenleme.

## Query

`?avail=1` → open availability editor once, then strip param (replace).

## Calendar rules

- Week starts Monday (`weekStartsOn: 1`)
- Day headers: `['Pzt','Sal','Çar','Per','Cum','Cmt','Paz']` — **değiştirme**
- Only days in current month selectable (`isSameMonth`)
- Default selected: today if viewing current month context (web: today on mount if isToday)

## Dots

Per day with entries via `getProgramEntriesForDate(myPrograms, day, user)`:
- workout present → workout dot
- nutrition present → nutrition dot  
(colors: web brand/sage — use design tokens)

## Day detail

1. Split `splitEntriesByType`
2. Workout rows: checkbox `toggleActivityCompletion`; thumb; amountText; tap thumb → ExerciseDetailModal; Play → inline/signed video
3. Nutrition: `groupEntriesByMeal` → MealGroupRow with label from MEAL_TYPES; content `mealContentText`; toggle whole meal via `toggleMealCompletion(dateStr, mealType, entryIds)`
4. Progress: `{ done, total }` = workoutDone + mealDone counts

## Availability

- Form: `user.availability` via `WeeklyAvailability` parity
- Save: `updateProfile({ availability })` → toast **Müsaitlik bilgileriniz kaydedildi**

## Header

PanelPageHeader title/subtitle/image: match web (`PANEL_IMAGES` calendar). Do not invent new title.

## Saving

While `saving`, ignore duplicate toggles.

## Acceptance

- [ ] MEAL_TYPES + keys from programs-model  
- [ ] completionKey / mealCompletionKey exact  
- [ ] avail=1 behavior  
- [ ] No invented meal types  
- [ ] Video via media LOCK rules  
