# Member — SessionBooker Modal (IMPLEMENTATION LOCK)

- **Component:** `SessionBooker.jsx` (used by MemberScheduleView)
- **Priority:** P1
- **Contract:** `contracts/api-book-session.md`

---

## Constants

```js
WINDOW_DAYS = 28
duration default = 30
// staff.availability[dow] = ['09:00','10:00',...] hour keys
// each hour expands to HH:00 and HH:30 slots
```

## Props

`open, onClose, type, staff, existingSessions, monthlyLimit, duration=30, accent, onBook(iso, duration), getBookedSlots(staffId, type, fromISO, toISO)`

## Steps UX

1. Modal title: **Randevu Al**
2. If !staff: **Henüz bir uzman atanmamış. Atama sonrası randevu alabilirsiniz.**
3. If no days with slots in 28d: **{staff.name} önümüzdeki 28 gün için müsaitlik belirtmemiş.**
4. Hint: **{staff.name} ile gün ve saati seçin, ardından randevuyu onaylayın.** + optional `Bu ay kalan hakkınız: {remaining}/{monthlyLimit}.`
5. Horizontal day picker (EEE / d / MMM, tr locale)
6. If limitReached: **Bu ay için randevu hakkınız doldu. Sonraki ay için bir gün seçebilirsiniz.**
7. Else time grid; disabled if past / taken / own / booking
   - titles: **Bu saatte zaten randevunuz var** / **Bu saat dolu**
   - empty day: **Bu gün için uygun slot yok.**
8. Confirm card:
   - **Randevuyu onaylayın**
   - Uzman / Tarih / Saat · `{duration} dk`
   - **Saati değiştir** / **Randevuyu Onayla** (loading: **Oluşturuluyor…**)

## Client toasts

| event | toast |
|-------|-------|
| past slot | Geçmiş bir saat seçilemez. (warning) |
| book fail | API error or **Randevu oluşturulamadı.** |
| book ok | **Randevunuz oluşturuldu.** |

## onBook

`onBook(dt.toISOString(), duration)` → `bookStaffSession` → API.

## Taken slots

`getBookedSlots(staff.id, type, from, to)` → Set of timestamps; disable those + own active sessions.

## Acceptance

- [ ] 28-day window, 30-min slots from hour availability  
- [ ] All strings above  
- [ ] Limit / past / taken / own logic  
