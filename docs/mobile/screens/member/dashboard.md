# Member — Dashboard (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/dashboard`
- **Web:** `/dashboard` → `DashboardPage.jsx`
- **Priority:** P0

Bölüm sırası ve metinler web ile kilitli. Yeni KPI kartı / farklı slogan ekleme.

---

## Early exit

`isFreeTrialExpired === true` → yalnızca `<FreeTrialExpiredGate />` (web bileşen davranışı). Dashboard içeriği **yok**.

## Data dependencies

`user`, `membership`, `membershipStatus`, `coachSessions`, `dietitianSessions`, `myPrograms`, `progress`, `premiumExpiresAt`, `premiumStartedAt`, `freeTrialExpiresAt`, `isFreeTrialExpired`, `posts`, `useDailyTip()`, `buildWeeklyAdherence(myPrograms, user.completedActivities, user)`.

`nextCoach` / `nextDietitian`: `status === 'scheduled' && date > now` first match.

`latestPosts`: published, sort createdAt desc, slice 0..3.

## Layout order (zorunlu)

1. **Welcome banner**
   - Date: `format(today, 'd MMMM yyyy, EEEE', { locale: tr })`
   - H1: `{firstName}, bugün harika bir gün olabilir` (`resolveFirstName`)
   - Sub: `Küçük adımlar büyük dönüşümlerin başlangıcıdır — görevlerinizi tamamlayarak ilerleyin.`
   - CTA: **Bugünkü Programım** → `/calendar`
   - CTA: **Sağlık Testleri** → `/health-test`
   - Photo: `PANEL_IMAGES.dashboardHero` (veya mobilde eşdeğer asset)

2. **Günün ipucu**
   - Label: `Günün ipucu`
   - Body: `dailyTip` (loading pulse)

3. **Deneme banner** — only `membership==='free' && freeTrialExpiresAt && !isFreeTrialExpired`
   - `Deneme süreniz: {hLeft} saat kaldı.`
   - Button: **Üye Ol** → membership

4. **Expiring banner** — `showExpiringBanner` (paid && (status expiring OR remainingDays 1..7))
   - Title: `Paket süreniz bitmek üzere` + optional `— {n} gün kaldı`
   - Sub: `Kesintisiz devam için planınızı yenileyin. Son gün dahil erişiminiz sürer.`
   - CTA: **Yenile** → membership

5. **Paid expired banner** — free && premiumStartedAt && !freeTrialExpiresAt && !isFreeTrialExpired
   - `Paket süreniz doldu`
   - `Ücretli özellikler kapandı. Devam etmek için bir plan seçip yenileyin.`
   - **Planı Yenile**

6. **Upsell** — free && !showPaidExpiredBanner
   - `Daha fazlasını keşfedin`
   - `Birebir koç & diyetisyen desteği için ücretli planlarımız`
   - **Planları İncele**

7. MembershipBadge + link **Destek Alanı** → `/support`

8. **StatsCard x4**
   - Aktif Plan → planLabel; sub free:`Sağlık testi` else `Koç & Diyetisyen destekli`; tap membership
   - Sonraki Koç → date `d MMM` or `—`; sub title or `Planlanmadı`; tap `schedule?tab=coach`
   - Sonraki Diyetisyen → same; tap `schedule?tab=dietitian`
   - Seri → `{user.streak ?? 0} gün` / `Kesintisiz gün`

9. Charts grid
   - Kilo Trendi — empty: `Kilo kayıtlarınız burada görünecek`
   - Antrenman Takibi — empty: `Antrenman verileriniz burada görünecek`
   - Öğün Takibi — empty: `Diyetisyen listeniz eklendikçe öğün verileri burada görünür`

10. Quick links (web’deki kalan Link grid — calendar, programs, library, messages, …) — **DashboardPage.jsx satır 252+ listesini birebir taşı**; yeni kısayol ekleme.

11. Latest blog cards (3) if any — paths via `blogPostPath`

12. Success story submit entry if web shows modal trigger — parity

## Side effects

`useStripePaymentReturn(refresh)` — mobile: IAP/deep link return refresh eşdeğeri.

## Acceptance

- [ ] FreeTrialExpiredGate short-circuit  
- [ ] Banner koşulları birebir  
- [ ] String’ler birebir  
- [ ] StatsCard seti 4; ekstra kart yok  
- [ ] firstName resolver parity  
