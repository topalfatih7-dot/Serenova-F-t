# Domain — Health Test Catalog

Self-contained question list extracted for mobile handoff.

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
Hastalıklar, ilaçlar, tahlil ve takviyeler

Audience: shared

| # | key | type | label |
|---|-----|------|-------|
| 1 | chronicConditions | multi | Tanı almış kronik rahatsızlıklarınız var mı? (geniş liste + other detail) |
| 2 | medications | single | Düzenli veya gerektiğinde kullandığınız ilaçlar var mı? (+ detail; softWarning if thyroid + none) |
| 3 | familyHistory | multi | Birinci derece yakınlarında hastalık (+ other detail; footerNote) |
| 4 | surgeries | single | Daha önce ameliyat geçirdiniz mi? (+ detail) |
| 5 | hospitalVisits | single | Son 12 ay hastanede yatış? (+ detail) |
| 6 | lastBloodWork | single | Son kan tahlili ne zaman? |
| 6a | bloodWorkUploadIntent | single followUp | Yüklemek ister misiniz? (when last_3_months / 3_12_months) |
| 6b | bloodWorkFiles | file followUp | PDF/foto yükle (when intent=yes) |
| 7 | supplements | multi | Vitamin/takviye listesi (+ other detail) |
| 7a–c | supplementsRecommendedBy / Duration / Frequency | single followUps | Takviye varsa cascade |
| 8 | mentalHealthSupport | single | Son 12 ay ruh sağlığı desteği |
| 9 | digestiveSymptoms | multi | Sık sindirim şikayetleri |
| 10 | doctorClearance | single | Doktor onayı |
| 11 | currentComplaints | text | İsteğe bağlı şikayet |

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
`diet_health`, `diet_lifestyle`, `diet_activity`, `diet_nutrition`, `diet_women`, `diet_extra` — see source file for full keys.


## Notes

- Full option lists live in web source; copy from `healthTestSections.js` / `healthTestDietitianSections.js`.
- All sections apply to every member; only `women` / `men` / `diet_women` are gender-gated (`genderOnly`).
- Audience labels (`shared` / `coach` / `dietitian`) are category chips only — not package locks.
- Gender-specific: `women` / `men` / `diet_women`.
- Storage: `health-lab-results` private; RLS folder = `auth.uid()`.
