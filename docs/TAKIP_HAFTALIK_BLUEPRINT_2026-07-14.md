# Antrenman & Öğün Takibi — Haftalık (Önceki Hafta + Bu Hafta) Blueprint

> **Tarih:** 2026-07-14 · **Durum:** 🟢 UYGULANDI
> **Hedef ajan:** Cursor / Grok 4.5
> **Amaç:** "Antrenman Tamamlama" ve "Öğün Takibi" tablolarını, 12 haftalık kümülatif bar grafiği yerine **önceki hafta** ve **bu hafta**yı yan yana karşılaştıran net bir takip görünümüne çevirmek.
> **Kural:** Bu dosya bir **uygulama sözleşmesidir**. Uygulamaya başlamadan önce "Ajan Çalışma Kuralları"nı oku.

---

## 0. Ajan Çalışma Kuralları (halüsinasyon önleme)

Bu kurallar **zorunludur**. İhlal = görev başarısız.

1. **Bu bir React WEB projesidir (Vite 8 + React 19).** React Native / Expo / Metro YOKTUR. Kanıt: `package.json`.
2. **Kanıtsız değişiklik yapma.** Her görevin "Kanıt" satırı `dosya:satır` referansı içerir. Satır numaraları kaymış olabilir; **içerik eşleşmesine** güven, değişiklikten önce dosyayı oku.
3. **Tek seferde tek görev.** Görevi bitir → kabul kriterini doğrula → sonraki göreve geç.
4. **Veri modeli DEĞİŞMEZ.** Tamamlama verisi `members.data.completedActivities[dateStr] = [key,...]` olarak kalır. **Migration YOK, JSONB şeması değişmez.** Sadece okuma/görselleştirme katmanı değişir.
5. **Mevcut kalıpları taklit et.** `date-fns` (`startOfWeek`/`endOfWeek` `weekStartsOn: 1`), `lucide-react`, TailwindCSS 4, `useMemo`. Yeni kütüphane EKLEME.
6. **Türkçe yorumları koru.** Kod yorumlarını silme.
7. **`npm run lint` yeşil kalmalı.** Her görev sonrası çalıştır.
8. **Hafta başlangıcı Pazartesi.** Takvim `startOfWeek(..., { weekStartsOn: 1 })` kullanır (`CalendarPage.jsx:93`). Yeni haftalık mantık da **Pazartesi başlangıçlı** olmalı — `memberProgress.js`'teki ISO hafta ile tutarlı.

---

## 1. Doğrulanmış Gerçekler (mevcut çalışma mantığı)

| Konu | Gerçek | Kanıt |
|------|--------|-------|
| Tamamlama kaydı | Üye takvimden işaretler; `member.completedActivities[dateStr]` içinde anahtar dizisi tutulur | `src/context/AppContext.jsx:1067-1097` |
| Tamamlama anahtarı | Antrenman: `${dateStr}_${entryId}`; öğün: `${dateStr}_meal_${mealType}` | `src/utils/programSchedule.js:186-193` |
| Bir güne düşen program | `getProgramEntriesForDate(programs, date, member)` | `src/utils/programSchedule.js:142-174` |
| Antrenman/öğün ayrımı | `splitEntriesByType` + `groupEntriesByMeal` | `src/utils/programSchedule.js:196-224` |
| Öğün tamamlandı mı | `isMealCompleted(...)` | `src/utils/programSchedule.js:212-217` |
| Haftalık kümül. veri | `buildWorkoutProgress` / `buildMealProgress` — ISO hafta, **son 12 hafta** | `src/utils/memberProgress.js:59-122` |
| Patch üretimi | `buildProgressPatch` → `progress.workouts`, `progress.meals` dizilerini toggle'da yeniden hesaplar | `src/utils/memberProgress.js:124-134`; çağrı `AppContext.jsx:1075,1095` |
| Grafik bileşenleri | `WorkoutChart`, `MealChart` (recharts BarChart) | `src/components/dashboard/ProgressChart.jsx:23-57` |
| Dashboard yerleşimi | "Antrenman Tamamlama" + "Öğün Takibi" kartları | `src/pages/DashboardPage.jsx:183-193` |
| Takvim (dokunulmaz) | Aylık takvim + gün detay modalı, işaretleme burada yapılır | `src/pages/CalendarPage.jsx` |

### Mevcut modelin sevilmeyen yönü

`progress.workouts` / `progress.meals` **son 12 haftanın** kümülatif bar grafiğidir. Kullanıcı için:
- Çok fazla hafta gösterir; "geçen hafta ne yaptım, bu hafta ne yapıyorum" karşılaştırması net değildir.
- `slice(-12)` ile eski haftalar birikir; grafik kalabalıklaşır.
- Bar grafiği "kaç/kaç" (tamamlanan/planlanan) sayısını hızlı okumayı zorlaştırır.

**İstenen:** Sadece **önceki hafta** ve **bu hafta**yı gösteren, gün gün okunabilen bir **karşılaştırma tablosu**.

---

## 2. Hedef Tasarım

İki kart (Antrenman Takibi, Öğün Takibi). Her kartta:

- Üstte iki sütun: **Geçen Hafta** ve **Bu Hafta** — her biri `tamamlanan / planlanan` + yüzde.
- Altta **7 günlük satır** (Pzt–Paz): her gün için o günün planlanan/tamamlanan durumu (nokta/ikon veya mini oran).
- Hafta aralığı etiketi: `7–13 Tem` gibi (date-fns `format`, `tr` locale).
- Bu hafta henüz gelmemiş günler "boş/gelecek" olarak nötr gösterilir (tamamlanmadı sayılmaz).

Görsel dil mevcut panelle uyumlu: antrenman `brand`, beslenme `sage` tonları; `glass-card-solid` kart kabuğu (`DashboardPage.jsx:179`).

---

## 3. Uygulama Sırası (özet)

| Görev | Öncelik | Zorluk | Dosya |
|-------|---------|--------|-------|
| 3.1 `buildWeeklyAdherence` yardımcı fonksiyonu | 🔴 Kritik | Orta | `src/utils/memberProgress.js` |
| 3.2 `WeeklyAdherenceTable` bileşeni | 🔴 Kritik | Orta | `src/components/dashboard/` (yeni) |
| 3.3 Dashboard entegrasyonu | 🔴 Kritik | Düşük | `src/pages/DashboardPage.jsx` |
| 3.4 (Opsiyonel) Staff/danışan görünümü | 🟢 Düşük | Düşük | staff sayfaları |

> **Not:** `buildProgressPatch` / `buildWorkoutProgress` / `buildMealProgress` **silinmez** (grafikler başka yerde de tüketiliyor olabilir; ayrıca `progress.weight`/`mood` aynı patch'ten geliyor). Yeni haftalık tablo bunlardan **bağımsız**, doğrudan `completedActivities` + `programs`'tan hesaplanır.

---

## 4. Görev 3.1 — `buildWeeklyAdherence`

**Dosya:** `src/utils/memberProgress.js`
**Kanıt (mevcut importlar):** `src/utils/memberProgress.js:1-8`

Aşağıdaki fonksiyonu dosyaya **ekle** (mevcutları silme). Pazartesi başlangıçlı hafta kullan.

```js
import {
  format, subDays, startOfDay, startOfWeek, endOfWeek,
  eachDayOfInterval, subWeeks, isAfter,
} from 'date-fns'
// (mevcut getISOWeek importları kalabilir; kullanılmıyorsa lint'e göre temizle)

/**
 * Bir hafta aralığı için gün gün antrenman/öğün planlanan+tamamlanan sayıları.
 * @returns {{ start, end, days: Array, workout: {planned,done}, meal: {planned,done} }}
 */
function weekAdherence(programs, completedActivities, weekStart, member, now) {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })
  const days = eachDayOfInterval({ start, end }).map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const isFuture = isAfter(startOfDay(date), startOfDay(now))
    const entries = getProgramEntriesForDate(programs, date, member)
    const { workout, nutrition } = splitEntriesByType(entries)
    const mealGroups = groupEntriesByMeal(nutrition)
    const keys = completedActivities[dateStr] || []
    const workoutDone = workout.filter((e) => keys.includes(completionKey(dateStr, e.id))).length
    const mealDone = mealGroups.filter((g) =>
      isMealCompleted(completedActivities, dateStr, g.mealType, g.entries)).length
    return {
      dateStr,
      date,
      isFuture,
      workout: { planned: workout.length, done: workoutDone },
      meal: { planned: mealGroups.length, done: mealDone },
    }
  })
  const sum = (sel) => days.reduce((acc, d) => {
    acc.planned += sel(d).planned
    acc.done += sel(d).done
    return acc
  }, { planned: 0, done: 0 })
  return { start, end, days, workout: sum((d) => d.workout), meal: sum((d) => d.meal) }
}

/** Önceki hafta + bu hafta antrenman/öğün takibi. */
export function buildWeeklyAdherence(programs, completedActivities = {}, member = null, now = new Date()) {
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
  const prevWeekStart = subWeeks(thisWeekStart, 1)
  return {
    thisWeek: weekAdherence(programs, completedActivities, thisWeekStart, member, now),
    prevWeek: weekAdherence(programs, completedActivities, prevWeekStart, member, now),
  }
}
```

**Kabul kriterleri:**
- `npm run lint` yeşil (kullanılmayan import bırakma).
- `buildWeeklyAdherence([], {})` hata vermez; `thisWeek.days.length === 7`.
- Gelecek günler `isFuture: true` döner ve `done` hesabına dahil olsa da UI'da "gelecek" olarak nötr gösterilecek (bkz. 3.2).

---

## 5. Görev 3.2 — `WeeklyAdherenceTable` bileşeni

**Yeni dosya:** `src/components/dashboard/WeeklyAdherenceTable.jsx`
**Referans stil:** `ProgressChart.jsx` (memo kalıbı), `CalendarPage.jsx:36` (`DAY_NAMES`).

Gereksinimler:
- Props: `{ title, icon, accent: 'brand'|'sage', metric: 'workout'|'meal', data }` — `data` = `buildWeeklyAdherence(...)` çıktısı.
- İki sütun: **Geçen Hafta** / **Bu Hafta**; her biri `done/planned` + `%`.
- 7 gün satırı: `DAY_NAMES` (Pzt…Paz). Her gün için:
  - `planned === 0` → nötr (tire).
  - `done === planned && planned > 0` → tamamlandı ikonu (sage `CheckCircle`).
  - `0 < done < planned` → kısmi (oran metni veya yarım dolu).
  - `done === 0 && planned > 0 && !isFuture` → eksik (nötr/kırmızımsı nokta).
  - `isFuture` → soluk/gelecek.
- Hafta aralığı etiketi: `format(start,'d')–format(end,'d MMM', {locale: tr})`.
- `memo` ile sarmalanmış; `lucide-react` ikonları.

Erişilebilirlik: tablo yapısı için `role` veya semantik `<table>` tercih edilir; hücrelerde `title`/`aria-label`.

**Kabul kriterleri:**
- Boş veri → "Veriniz burada görünecek" tarzı nötr durum (mevcut `ChartEmpty` deseni, `DashboardPage.jsx` içinde tanımlı).
- Mobilde (≤ `sm`) iki sütun taşmadan sığar (dikey stack gerekebilir).

---

## 6. Görev 3.3 — Dashboard entegrasyonu

**Dosya:** `src/pages/DashboardPage.jsx`
**Kanıt:** import `:12`, kullanım `:183-193`.

Yapılacak:
1. `import { buildWeeklyAdherence } from '../utils/memberProgress'` ekle (üstte).
2. `WorkoutChart` / `MealChart` importunu koru veya kaldır (kullanılmıyorsa lint için kaldır).
3. `const weekly = useMemo(() => buildWeeklyAdherence(myPrograms, user.completedActivities, user), [myPrograms, user])` — `myPrograms` ve `completedActivities` kaynaklarını mevcut `useApp()` değerlerinden al (Dashboard'da `progress`, `user` zaten mevcut; `myPrograms` için `useApp()`'ten al).
4. `:183-193` arasındaki "Antrenman Tamamlama" ve "Öğün Takibi" kart içeriklerini `WeeklyAdherenceTable` ile değiştir:
   - Antrenman kartı → `<WeeklyAdherenceTable title="Antrenman Takibi" metric="workout" accent="brand" data={weekly} .../>`
   - Öğün kartı → `<WeeklyAdherenceTable title="Öğün Takibi" metric="meal" accent="sage" data={weekly} .../>`
5. "Kilo Trendi" kartı (`:180-181`) **AYNEN KALIR** (`WeightChart`).

**DOKUNULMAYACAK:**
- `CalendarPage.jsx` (işaretleme akışı).
- `AppContext.jsx` toggle fonksiyonları ve `buildProgressPatch` çağrıları.
- `programSchedule.js`.

**Kabul kriterleri:**
- Dashboard'da iki kart artık geçen/bu hafta tablosu gösterir.
- İşaretleme (takvimden) → sayfa yenilenince tablo güncellenir.
- `npm run lint` ve `npm run build` yeşil.

---

## 7. Görev 3.4 — (Opsiyonel) Staff/danışan görünümü

Eğer koç/diyetisyen danışanın haftalık takibini görüyorsa, aynı `WeeklyAdherenceTable` + `buildWeeklyAdherence(clientPrograms, client.completedActivities, client)` ile salt-okunur gösterilebilir. **Kullanıcı onayı olmadan yeni sayfa ekleme.** Önce mevcut staff danışan sayfalarında böyle bir takip alanı var mı doğrula (`src/pages/staff/StaffClientProgramPage.jsx`, `StaffClientsPage.jsx`).

---

## 8. Doğrulama (elle)

1. `npm run dev`.
2. Üye olarak takvimde bu haftadan ve geçen haftadan birkaç aktivite/öğün işaretle.
3. Dashboard'a dön → iki tabloda geçen/bu hafta oranlarının doğru geldiğini gör.
4. Pazartesi başlangıcı doğrula (hafta sınırı takvimle aynı).
5. Gelecek günler nötr görünüyor mu kontrol et.

## 9. Riskler

- **Hafta başlangıcı tutarsızlığı:** ISO hafta (`getISOWeek`) ve `startOfWeek(weekStartsOn:1)` çoğunlukla örtüşür ama yıl sınırında farklılık olabilir. Yeni tablo tamamen `startOfWeek`/`endOfWeek` kullandığından takvimle bire bir tutarlıdır — ISO fonksiyonlarına yeni tabloda bağlı KALMA.
- **`completedActivities` boş/eski kayıt:** Fonksiyonlar boş diziye karşı güvenli olmalı (yukarıdaki `|| []` ve `|| {}`).
