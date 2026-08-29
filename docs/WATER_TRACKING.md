# Su takibi — kilitli spec (web + mobil)

> **Kilit:** 2026-08-25 · Web uygulandı · Mobil ajan bu dosya + `docs/mobile/domains/water-tracking.md` okumadan kod yazmaz.
> SoT web: `src/utils/waterTracking.js`, `src/components/water/*`, migration `20260825_member_water_logs.sql`.

## Ürün

| Kural | Değer |
|-------|--------|
| Varsayılan hedef | **2000 ml**/gün (`DEFAULT_WATER_GOAL_ML`) |
| Hedefi kim değiştirir | Yalnız **diyetisyen** ve **admin** (`set_member_water_goal`) |
| Üye hedefi | Değiştiremez (`saveMemberPatch` `waterTracking` yutar) |
| Kayıt | Yalnız sayısal **ml** (1–1000). Bardak sayısı yok |
| Bilgi | “Ortalama bir su bardağı yaklaşık 200 ml’dir.” — hesap değildir; 2000 ml “10 bardak” diye yazılmaz |
| İçecek | Yalnız su |
| Kim loglar | Yalnız üye. Personel INSERT yok |
| Nav | Ayrı `/water` yok |
| Seri | `user.streak` suya bağlanmaz |
| Anket | `healthTest.nutritionWaterIntake` tracker’ı doldurmaz |

Hedef öneridir, tıbbi tavsiye değildir. UI tavanı hedef **500–5000 ml**.

## Veri

**Hedef** — `members.data.waterTracking`:

```json
{
  "dailyGoalMl": 2000,
  "goalUpdatedAt": "2026-08-25T10:00:00Z",
  "goalUpdatedBy": { "id": "uuid", "name": "Ayşe", "role": "dietitian" }
}
```

Yoksa hedef 2000. `goalUpdatedBy` yoksa “Hedefi diyetisyeniniz belirledi” gösterilmez.

**Kayıtlar** — `member_water_logs`:

- `id`, `member_id`, `local_date` (date), `amount_ml`, `logged_at`, `source='member'`
- `local_date` = cihaz yerel `yyyy-MM-dd` (takvimle aynı; `Europe/Istanbul` randevu TZ ile karıştırma)
- İleri tarih INSERT yok (istemci)
- Index `(member_id, local_date)`
- RLS: SELECT üye + admin + `staff_manages_member`; INSERT/DELETE yalnız `auth.uid() = member_id`
- Realtime publication açık

RPC `set_member_water_goal(p_member_id, p_goal_ml)` — security definer, diyetisyen (atanmış) veya admin.

`calorieHistory` JSONB kopyalanmaz.

## Görsel kilit — Şişe + lagün

Token: web `src/index.css` / mobil `02-design-system.md` (brand, sage, cream, gold, Plus Jakarta). Mor hidrasyon teması, lama, 8 bardak ikonu, Lottie konfeti **yasak**.

Üye kartı düz halka değil. Bileşen: web `WaterCarafeCard.jsx` → mobil aynı layout (`size=full|compact`).

- Kicker 11px uppercase tracking: **Su takibi**
- Kart arka planı lagün (cyan→teal). Solda cam şişe; sıvı `clipPath` ile `% = todayMl/goalMl` (max 100, tabanda min ~%6).
- Seviye 850ms ease-out yükselir. Hedef dolunca sage sıvı + metin **Hedef doldu**.
- Full şişe ~216px, compact ~144px.
- Form: `input[type=number]` + **Ekle** + **Son kaydı geri al**.
- Personel: şişe **yok** — `StaffWaterProgress` yatay bar + 7 gün çubuk.

## Yüzeyler

**Üye panel** (`DashboardPage` karşılama banner’ının hemen altı, sağlık skoru ile yan yana): full şişe. `isUnpaidMember` dahil. `FreeTrialExpiredGate` varsa panel yok.

**Üye takvim** (ücretli): gün detay modal üstü compact karaf. Ay ızgarasında su noktası yok. Geçmiş güne kayıt serbest; gelecek yok.

**Personel** `StaffClientsPage` Bilgiler + `MemberHealthProfilePanel` + admin üye modal: `StaffWaterProgress`. Hedef alanı yalnız dietitian/admin.

## Bildirimler

| Kanal | Davranış |
|-------|----------|
| Mobil `habit_water` 10:30 / 14:00 / 16:00 | OS-only, listeye yazılmaz. `reminderNotifs === false` veya sessiz 22:00–08:00 → yok. **Bugün ml ≥ hedef** ise kalan slot kurulmaz. Gövde: `Hedefe {n} ml kaldı.` veya `Günlük hedef 2000 ml.` Tap: dashboard. Bildirimden ml ekleme yok. Web’de bu ziller yok (MOBILE DIFF). |
| Hedef değişince | `type: reminder`, `action: water_goal_updated`, listeye yazılır + Expo push. Tap: dashboard. WhatsApp/e-posta yok. |
| Android reboot | `BOOT_COMPLETED` yok; slot uygulama açılınca kurulur. |

Web zamanlanmış su zili yok.

## Web dosyalar

- `src/utils/waterTracking.js`
- `src/services/waterLogs.js`
- `src/hooks/useWaterLogs.js`
- `src/components/water/WaterCarafeCard.jsx`, `MemberWaterTracker.jsx`, `StaffWaterProgress.jsx`
- `src/pages/DashboardPage.jsx`, `CalendarPage.jsx`, `NotificationsPage.jsx`
- `src/pages/staff/StaffClientsPage.jsx`, `src/pages/admin/AdminMembersPage.jsx`
- `src/components/member/MemberHealthProfilePanel.jsx`

## Mobil uygulama sırası (bu turda kod yok)

1. Port `waterTracking` utils + `member_water_logs` client (JWT)
2. `WaterCarafeCard` / `StaffWaterProgress` web birebir
3. Dashboard grid + calendar day sheet
4. `habit_water` skip + kalan ml copy (`engagementReminders.ts`)
5. Notifications map: `water_goal_updated` → dashboard
6. Dietitian/admin goal RPC

## Yasak

Bardak sayacı, hazır 200 ml tuşu, kahve/çay katsayısı, otomatik ml/kg hedef, Apple Health, widget, bildirimden hızlı ekleme, WhatsApp su, üye hedefi, suyun öğün serisine eklenmesi, ayrı rota, düz gri halka, mor tema.

## Kopya

`WATER_COPY` — `src/utils/waterTracking.js`. Toast: **Su kaydı eklendi** / **Son kayıt geri alındı** / **Günlük su hedefi güncellendi**.
