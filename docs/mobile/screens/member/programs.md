# Member — Programs (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/programs`
- **Web:** `/programs` → `ProgramsPage.jsx`
- **Priority:** P0

---

## Header (birebir)

- title: **Programlarım**
- subtitle: **Koçunuz ve diyetisyeniniz tarafından hazırlanan programlar**

## Filters (yalnızca bunlar)

| id | label |
|----|-------|
| all | Tümü |
| workout | Antrenman |
| nutrition | Beslenme |

## Empty

- title: **Henüz program yok**
- description: **Koçunuz veya diyetisyeniniz size bir program oluşturduğunda burada görünecek ve bildirim alacaksınız.**

## List item

- Program type icon (workout/nutrition)
- Title, staff/meta as web
- Entries grouped via `groupBySchedule` (programs-model)
- Entry row: ExerciseVideoThumbnail + name + amountText
- Tap → video modal (`VideoPlayer` + signed URL); prefetch on press

## amountText

duration → `{amount} {durationUnit||'sn'}`; else `{amount} tekrar`

## Acceptance

- [ ] Filter ids/labels exact  
- [ ] Empty copy exact  
- [ ] groupBySchedule parity including daily fixed labels  
- [ ] No client-side program editing for members  
