# Domain — Health Test Catalog

Self-contained question list extracted for mobile handoff.

**Full option tables (LOCK):** [health-test-options.md](health-test-options.md) — do not invent values/labels.

**Question types:** `emoji | single | multi | text | time | scale | file`

**Engine extras:** `detail`, `followUps[]` (conditional), `softWarning`, `footerNote`, `infoNote` / `infoNoteWhen`, exclusive multi options (`exclusive: true`).

**360 scores:** After all applicable sections complete, `aiAnalysis.generateHealthAnalysis` → `radarScores` (metabolic, nutrition, activity, sleep, stress, digestion, lifestyle, overall). Hub shows `HealthRadarScores`.

**Lab uploads:** Private bucket `health-lab-results`, path `{userId}/…`, via `uploadHealthLabResult`.


## File: src/data/healthTestSections.js

### `general` — Genel Değerlendirme
Ruh hali, enerji, motivasyon ve stres yönetimi

Audience: shared

| # | key | type | label |
|---|-----|------|-------|
| 1 | wellbeing | emoji | Son 2 hafta içinde kendinizi genel olarak nasıl hissettiniz? |
| 2 | energy | emoji | Son 2 hafta içinde gün içindeki enerji seviyenizi nasıl değerlendirirsiniz? |
| 3 | motivation | scale | Sağlıklı yaşam hedeflerinize ulaşmak için kendinizi ne kadar motive hissediyorsunuz? (0–10) |
| 4 | biggestBarrier | single | Sağlık hedeflerinize ulaşmanızın önündeki en büyük engel nedir? (+ other detail) |
| 5 | concentration | single | Günlük yaşamınızda dikkatinizi toplamakta zorlanıyor musunuz? |
| 6 | anxiety | single | Son 2 hafta içinde kendinizi ne kadar endişeli hissettiniz? |
| 7 | dailyStressImpact | single | Son 2 hafta içinde stresin günlük yaşamınızı ne kadar etkilediğini düşünüyorsunuz? |
| 8 | stressCoping | single | Stresle başa çıkabildiğinizi düşünüyor musunuz? |
| 9 | socialSupport | single | Sağlıklı yaşam hedefleriniz konusunda ailenizden veya yakın çevrenizden destek görüyor musunuz? |
| 10 | readinessToChange | single | Yaşam tarzı değişikliklerine ne kadar hazırsınız? (hint) |
| 11 | painScale | scale | Son bir hafta içindeki genel ağrı seviyenizi nasıl değerlendirirsiniz? (0–10) |
| 12 | lifeQuality | emoji | Son zamanlarda yaşam kalitenizi nasıl değerlendirirsiniz? |

Removed from general: `moodCheckin`, `selfConfidence`, `weightChange` (moved).

### `medical` — Tıbbi Geçmiş
Hastalıklar, ilaçlar ve tıbbi takip (önceki katalog; 360 revizyonundaki tıbbi genişletmeler geri alındı)

Audience: shared

| # | key | type | label |
|---|-----|------|-------|
| 1 | chronicConditions | multi | Tanı almis kronik rahatsızlıklarınız var mi? |
| 2 | medications | single | Düzenli kullandiginiz ilaç var mi? |
| 3 | familyHistory | multi | Ailenizde aşağıdaki rahatsızlıklardan hangileri var? |
| 4 | surgeries | single | Gecirdiginiz ameliyat var mi? |
| 5 | hospitalVisits | single | Son 12 ayda hastane aciline basvurdunuz mu? |
| 6 | lastBloodWork | single | Son kapsamli kan tahlilinizi ne zaman yaptırdınız? |
| 7 | supplements | multi | Düzenli kullandiginiz takviyeler hangileri? |
| 8 | mentalHealthDiagnosis | single | Bir ruh sagligi tanı veya tedavi geçmişiniz var mi? |
| 9 | doctorClearance | single | Egzersiz veya kilo yonetimi programi icin doktor onayi |
| 10 | bloodPressureIssues | single | Tansiyon dalgalanmasi |
| 11 | digestiveDisorders | single | Tanı almis sindirim sistemi rahatsizligi |
| 12 | thyroidStatus | single | Tiroid durumu |
| 13 | currentComplaints | text | Şikayet (opsiyonel) |

Moved out: `injuries` → `physical` (coach).

### `physical` — Fiziksel Kapasite
Hareket geçmişi ve antrenman hazırlığı

Audience: coach

| # | key | type | label |
|---|-----|------|-------|
| 1 | injuries | single | Son 2 yıl sakatlık/ortopedik sorun |
| 1a | injuryRegions | multi followUp | Bölge (yes* cevaplarında) |
| 1b | injuryCause | single followUp | Neden |
| 1c | injuryLimitation | single followUp | Hareket kısıtı |
| 1d | injuryDoctorRestriction | single followUp | Doktor egzersiz kısıtı |
| 2+ | activityFrequency … performanceGoal | … | (mevcut koç soruları) |

### `lifestyle` — Yaşam Tarzi
Audience: coach — unchanged keys (`sittingHours`, `smoking`, `alcohol`, …).

### `women` / `men`
Audience: shared (+ genderOnly) — unchanged.


## File: src/data/healthTestDietitianSections.js

### `diet_reason` — Başvuru Nedeni
Audience: dietitian

| # | key | type | label |
|---|-----|------|-------|
| 1 | dietReason | multi | Diyetisyen desteği alma nedeniniz |
| 2 | bodyAppearance | emoji | Fiziksel görünüm hissi (from general) |
| 3 | primaryGoalReason | single | Sağlıklı yaşam hedefinin en önemli nedeni |
| 4 | weightChange | single | Son 3 ay kilo değişimi (+ kg detail) |
| 5 | dietGoal | text | Hedefiniz nedir? |

### Other diet sections
`diet_health`, `diet_lifestyle`, `diet_activity`, `diet_nutrition`, `diet_women`, `diet_extra` — see source file for full keys. All asked to every member (except `diet_women` → female only).


## Notes

- Full option lists live in web source; copy from `healthTestSections.js` / `healthTestDietitianSections.js`.
- **No package gating:** coach/dietitian `audience` is a UI category label only; every member gets every non-gender section.
- Gender-specific: `women` / `men` / `diet_women`.
- Analysis: `describeHealthTest` + `buildHealthTestSummary` + `radarScores` use the full answer set.
