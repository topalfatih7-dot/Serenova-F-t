# Staff — Client Program Builder (IMPLEMENTATION LOCK)

- **Expo:** `/(staff)/clients/[memberId]/program`
- **Web:** `/staff/clients/:memberId/program` → `StaffClientProgramPage.jsx`
- **Priority:** P1
- **Flow:** F11
- **Role:** coach only (dietitian redirected to lists)

---

## Access

- Staff auth; member in `getStaffClients`
- `memberHasProgramTypePackage` / package windows — warn outside range (`findEntriesOutsidePackage`)

## Cart entry factory (birebir)

```js
{
  id: `e-${Date.now()}-${random}`,
  exerciseId, exerciseName,
  videoUrl, videoPending,
  description,
  amountType: 'reps',  // default
  amount: 12,
  durationUnit: 'sn',
  note: '',
}
```

## UX blocks

1. Library filters (`ExerciseLibraryFilters` parity) + pagination  
2. Cart list: `CartEntryCard` — thumb, order badge, move up/down, patch amountType/amount/note, remove, preview video  
3. Mobile: bottom bar + sheet for cart (web mobile-first)  
4. Send → `CoachProgramSendModal`

## CoachProgramSendModal validation toasts (birebir)

| Condition | Toast |
|-----------|-------|
| empty cart | En az bir hareket ekleyin |
| custom range end < start | Bitiş tarihi başlangıçtan önce olamaz |
| session end <= start | Seans bitiş saati başlangıçtan sonra olmalı |
| !hasWorkoutDays | Danışan antrenman günü belirtmemiş. Önce müsaitlik doldurmasını isteyin. |

Date modes: `fixed14` (CYCLE_PLAN_LENGTH=14) | `custom` range.  
Title: `buildCoachProgramTitle(...)` — use `utils/coachProgram.js` port.  
Payload: `buildCoachProgramPayload` → `createProgram` / onSubmit.

## Do not

- Change default amount 12 / amountType reps without product decision  
- Allow dietitian on this route  

## Acceptance

- [ ] createCartEntry defaults  
- [ ] Send modal toasts exact  
- [ ] Package date bounds via getDateInputBounds  
- [ ] Video thumb/sign rules  
