# Personel ↔ Üye Akışları — İleri Faz & Açık Kararlar

> **Kaynak tarama:** 2026-07-31 · Personel ↔ Üye Akış Denetimi  
> **Tur 1–8:** kararlar kilitli; uygulama 2026-07-31 (pending randevu, lab RLS, üçlü collab, brief filtre, doktor nav, program empty).  
> Skill: `.cursor/skills/yeniform-staff-admin/`

---

## Tur 1 — Atama (kilitli + uygulandı)

### Ürün kararları
- Atama **yalnızca admin** (`AdminPremiumPage` / `adminUpdatePremiumMembership`).
- **Doktor her zaman manuel** — `assignStaffOnly` auto-assign doktoru kapsamaz; bilinçli.
- Ücretli + eksik atama → dashboard **“Uzmanınız atanıyor”** banner (`memberNeedsStaffAssignment`).
- Profilde **pakette olmayan roller gizlenir**.

### Sonraya bırakılan (kodlanmadı)
| Madde | Not | Önerilen giriş noktası |
|-------|-----|------------------------|
| Personel “claim / üzerine al” | Staff kendini atayamaz | `staffAssignment.js` + staff clients UI + admin audit |
| Atama bekleme kuyruğu / destek ticket | Banner yeterli sayıldı | `ActivationChecklist` / support |
| Doktor auto-assign | Bilinçli kapalı kalacak | `assignStaffOnly` — ekleme |

---

## Tur 2 — Program / takvim tamamlanma (KİLİTLİ)

### Ürün kararları
1. **Staff adherence UI** — şimdilik yapılmaz; sonraya bırakıldı (haftalık özet + gün gün tamamlanma).
2. **Üye empty state ayrımı yapılacak** (`ProgramsPage` / gerekirse `CalendarPage`):
   - Atama yok (paketteki rol için) → “Uzmanınız atanıyor”
   - Atama var, program yok → “Uzmanınız program hazırlıyor”
3. Gün gün / % adherence personelde — **değişiklik yok**, sadece bu belgede tutulur.

### Sonraya bırakılan
| Madde | Not |
|-------|-----|
| Staff haftalık adherence özeti | `buildWeeklyAdherence` + client sayfası |
| Staff gün gün completedActivities | Ayrı UI |

### Uygulama adayı (sonraki execute)
- `ProgramsPage.jsx` (+ takvim empty): atama vs program ayrımı metinleri

### Dosyalar
`StaffClientProgramPage.jsx`, `ProgramsPage.jsx`, `CalendarPage.jsx`, `utils/memberProgress.js`, `WeeklyAdherenceTable.jsx`

---

## Tur 3 — Randevu / video / hakediş (KİLİTLİ)

### Ürün kararları — onay modeli
Üye book → **anında `scheduled` değil**; `pending` talep. Personel onaylamadan gerçek randevu yok.

| Durum | Anlam |
|-------|--------|
| `pending` | Onay bekliyor; video kapalı |
| `scheduled` | Onaylı; video join açık |
| `rescheduled` | Üye ≥24s kala +3/+5 gün taşıdı |
| `cancel_pending` | Üye iptal talebi; personel onay/red; slot dolu; video açık |
| `admin_cancel_pending` | Personel &lt;24s iptal; yalnız web admin onay/red; slot dolu |
| `rejected` | Personel reddetti; üye bildirimi; yeni talep açabilir |
| `cancelled` | Kesin iptal (üye talebi onaylandı / personel / admin / paket) |
| `completed` | Video attendance sonrası (değişmez) |

1. **Pending limit + slot kilitler** — kota ve saat talep anında tutulur (`staff_booked_slots` + aylık/tek sefer limit’e `pending` / `cancel_pending` / `admin_cancel_pending` ekle).
2. **Red** → `rejected` + üye in-app bildirim; üye yeniden book eder. Zorunlu red nedeni yok (şimdilik).
3. **Alternatif saat önerme yok** — yalnız onay / red.
4. **Admin manuel seans** → doğrudan `scheduled` (onay atlanır); admin her zaman anında iptal edebilir (`forceAdmin`).
5. **Doktor hakediş** → sonraya (`BILLABLE_TYPES` değişmez).
6. **24s iptal/yeniden planla** — üye ≥24s: iptal = `cancel_pending` (personel onay); &lt;24s: iptal/yeniden planla yok. Pending talep anında çekilir. Personel ≥24s anında iptal; &lt;24s → `admin_cancel_pending`. Booker’da kural onayı zorunlu.

### Personel UI (uygulama)
- Pending book kuyruğu + **iptal talepleri** kuyruğu (overview) + Onayla / Reddet.
- Staff kendi adına book açmaz (üye talep eder; admin bypass).
- Admin (yalnız web): `admin_cancel_pending` kuyruğu.

### Ana dosyalar
`api/_bookSession.js`, `api/_sessionCancel.js`, `api/_sessionReschedule.js`, staff approve/reject API, `SessionCard.jsx`, `staffAppointments.js`, `StaffOverviewPage.jsx`, `StaffAppointmentRow.jsx`, `AdminSessionsPage.jsx`, `staff_booked_slots` / limit sayımı, `AppointmentsPage.jsx`, bildirimler

---

## Tur 4 — Chat / collab (KİLİTLİ)

### Ürün kararları
1. **Üçlü collab** — koç + diyetisyen + doktor, ortak danışan için collab thread’e doktor da dahil.
2. Atamasız ücretli üye Mesajlar empty state → dashboard ile aynı dil: **“Uzmanınız atanıyor”**.
3. Bu turda chat’te başka değişiklik yok (consent, dış iletişim engeli vb. aynı).

### Uygulama notları
- `staffCollabChatDb.js` / collab eligibility: doktor ataması + paket doktor entitlement koşullarını ekle.
- Staff collab UI: doktor rolü thread’e girebilsin; nav’da collab doktor için açılabilir hale gelsin (`staffNav`).
- `MessagesPage.jsx` empty copy hizası.

### Dosyalar
`chatAccess.js`, `MessagesPage.jsx`, `StaffMessagesPage.jsx`, `StaffCollabMessagesPage.jsx`, `staffCollabChatDb.js`, `staffNav.js`

---

## Tur 5 — Sağlık testi → staffBrief (KİLİTLİ)

### Ürün kararları
1. **Doktor mevcut `staffBrief`’i görür** (ayrı doctor prompt yok; aynı brief UI açılır).
2. **Audience filtreleri aktif** — koç yalnız coach (+ shared); diyetisyen dietitian (+ shared); doktor shared + kendine ait alanlar (brief’te doctor segmenti yoksa shared + genel). Her rol yalnız kendi alanını görür.
3. Bu turda başka sağlık-testi değişikliği yok.

### Uygulama notları
- `StaffHealthBrief.jsx` / health profile: role-based section filter; doktor için brief gate’i kaldır.
- Prompt/schema’da `audience` alanları tutarlıysa filtrele; yoksa `shared` default + role key’lerine göre kes.

### Dosyalar
`StaffHealthBrief.jsx`, `MemberHealthProfilePanel.jsx`, `api/ai-health-analysis.js`, `api/_ai-prompts.js`

---

## Tur 6 — Lab / kan tahlili (KİLİTLİ)

### Ürün kararları
1. **Lab dosya okuma:** atanmış **doktor + koç + diyetisyen** + admin (`health-lab-results` storage SELECT / signed URL).
2. **UI:** bu turda geniş lab inceleme ekranı yok — **yalnız RLS düzelt**; gerekirse mevcut health profilinde minimal link (zorunlu değil, “minimal”).
3. **Pazarlama copy** bu turda dokunulmaz → **Tur 8**.
4. Başka lab değişikliği yok (yazılı lab yorumu / ayrı inceleme paneli sonraya).

### Uygulama notları
- Yeni migration: `health-lab-results` policy — `staff_manages_member` veya assigned_* eşleşmesi ile path `{member_id}/*` okuma.
- `npm run db:migrate` sonrası doğrula.
- Geniş UI + copy → ileri / Tur 8.

### Dosyalar
`uploadHealthLabResult`, storage migration `health-lab-results`, `HealthTestStep.jsx`, `MemberHealthProfilePage.jsx`

---

## Tur 7 — Klinik notlar (`healthStaffNotes`) (KİLİTLİ)

### Ürün kararları
1. **İç notlar staff-only** — üye `healthStaffNotes` görmez (mevcut davranış korunur).
2. **Ayrı paylaşılan özet / lab yorum alanı yok** — üyeye gidecek geri bildirim **chat** ile.
3. Bu turda başka not değişikliği yok (kod yok; bilinçli no-op).

### Dosyalar
`healthStaffNotes.js`, `HealthStaffNotesPanel.jsx`, `MemberHealthProfilePage.jsx`

---

## Tur 8 — Doktor paneli + pazarlama / entitlement (KİLİTLİ)

### Ürün kararları
1. **Doktor nav minimum:** Genel bakış, Danışanlar, Mesajlar, **Ekip Mesajları** (Tur 4 üçlü collab), Admin mesajları, Bildirimler, Profil, Ödemeler. **Programlar / Kütüphane / Listeler yok.**
2. Üye dashboard: doktor entitlement varsa **“Sonraki Doktor”** stats kartı.
3. **Pazarlama / “kan tahlili” copy** — bu turda dokunulmaz (sonraya).
4. Başka doktor/pazarlama maddesi yok.

### Dosyalar
`staffNav.js`, `DashboardPage.jsx`, `MemberPlansPage.jsx`, `MembershipComparison*.jsx`, `api/_planEntitlements.js`

---

## Uygulama durumu (2026-07-31)

| Tur | Durum |
|-----|--------|
| 1 Atama | Uygulandı (önceki) |
| 2 Program empty | Uygulandı |
| 3 Pending onay | Uygulandı (`pending` / onay-red / slot+limit / doktor limit) |
| 4 Üçlü collab | Uygulandı |
| 5 Brief + audience | Uygulandı |
| 6 Lab RLS | Uygulandı (UI genişletme sonraya) |
| 7 Notlar | No-op |
| 8 Doktor nav + Sonraki Doktor | Uygulandı (pazarlama copy sonraya) |

### Hâlâ sonraya
- Staff adherence UI
- Doktor hakediş
- Lab inceleme UI
- Pazarlama “kan tahlili” copy hizası
- Personel claim / atama kuyruğu

---

## İlgili kod (hızlı indeks)

| Akış | Ana dosyalar |
|------|----------------|
| Atama | `staffAssignment.js`, `AdminPremiumPage.jsx`, `membershipPlans.memberNeedsStaffAssignment` |
| Program | `CoachProgramEditor.jsx`, `NutritionProgramBuilder.jsx`, `createProgram` |
| Randevu | `AppointmentsPage.jsx`, `api/_bookSession.js` |
| Chat | `chatAccess.js`, `chatDb.js` |
| Sağlık | `ai-health-analysis.js`, `StaffHealthBrief.jsx` |
| Lab | `uploadHealthLabResult`, storage migration `health-lab-results` |
