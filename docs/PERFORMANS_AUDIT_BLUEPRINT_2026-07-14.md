# Performans & Mimari Audit — Cursor Uygulama Blueprint'i

> **Tarih:** 2026-07-14 · **Durum:** 🟢 UYGULANDI (4.1 hariç — ayrı plan)  
> **Hedef ajan:** Cursor / Grok 4.5  
> **Amaç:** Panellerde telefonun ısınması, pil tüketimi, jank ve zamanla artan bellek sorunlarını gidermek.  
> **Kural:** Bu dosya bir **uygulama sözleşmesidir**. Aşağıdaki "Ajan Çalışma Kuralları" bölümünü uygulamaya başlamadan önce oku.

---

## 0. Ajan Çalışma Kuralları (halüsinasyon önleme)

Bu kurallar **zorunludur**. İhlal = görev başarısız.

1. **Bu bir React WEB projesidir (Vite + React 19).** React Native DEĞİLDİR. `react-native`, Metro, Reanimated, FlashList, Hermes, Expo YOKTUR. Kanıt: `package.json:43-71`. Bu teknolojilerden hiçbirini önerme veya ekleme.
2. **Kanıtsız değişiklik yapma.** Her görev "Kanıt" satırındaki `dosya:satır` referansını içerir. Değişiklikten önce o dosyayı **oku ve doğrula**. Satır numaraları kaymış olabilir; içerik eşleşmesine güven.
3. **Tek seferde tek FAZ, tek görev.** Görevler bağımsızdır. Bir görevi bitir, kabul kriterini doğrula, sonra diğerine geç. Alakasız değişiklikleri BİRLEŞTİRME.
4. **`DOKUNULMAYACAK` listelerine uy.** Bir görevde belirtilen dosyalar dışına çıkma.
5. **Davranışı koru.** Bu bir refactor/optimizasyondur. Görünür UI davranışı, iş mantığı ve veri akışı değişmemelidir (aksi belirtilmedikçe).
6. **Mevcut kalıpları taklit et.** Proje `useMemo`/`useCallback` kullanır, `date-fns`, `lucide-react`, TailwindCSS 4, framer-motion kullanır. Yeni kütüphane EKLEME (Task 1.1'deki opsiyonel `use-context-selector` hariç — o da yalnızca kullanıcı onayıyla).
7. **Yorumları koru.** Kod yorumlarını (özellikle Türkçe açıklamaları) silme.
8. **`build` ve `lint` yeşil kalmalı.** Her görev sonrası `npm run lint` çalıştır; hata bırakma. ESLint config: `eslint.config.js` (react-hooks kuralları aktif).
9. **Doğrulayamadığın şeyi "yapıldı" sayma.** Bundle boyutu, FPS, bellek gibi runtime metrikleri statik olarak kanıtlanamaz; bunları "tahmin" olarak işaretle.

---

## 1. Doğrulanmış Gerçekler (bağlam)

| Konu | Gerçek | Kanıt |
|------|--------|-------|
| Stack | Vite 8 + React 19 + react-router-dom 7 | `package.json:43-70` |
| Giriş | `createRoot` + `StrictMode` | `src/main.jsx:6-9` |
| State | Yalnızca 2 Context: `AppContext`, `ToastContext`. Redux/Zustand/TanStack Query YOK | `package.json`, `src/context/` |
| Backend | Supabase (DB + Realtime + Auth + Storage), Daily.co video, Stripe | `package.json:44-55` |
| `React.memo` kullanımı | **Sıfır** (tüm `src/` içinde hiç yok) | grep: `React.memo\|memo(` → sonuç yok |
| `useApp()` tüketici sayısı | **74 dosya** | grep: `useApp()` → 74 dosya |
| `backdrop-filter/backdrop-blur` | **55 dosya** | grep: `backdrop-blur` |
| Rota kod bölme | `LandingPage` HARİÇ tüm sayfalar `lazy()` | `src/App.jsx:16` (eager), `18-78` (lazy) |
| Vite chunk | `manualChunks` YOK | `vite.config.js:108-113` |

---

## 2. Kök Neden Özeti

Isınma/pil/jank üç birleşik kök nedenden kaynaklanır:

- **KÖK-1 (Render fırtınası):** `AppContext` tek dev "god context" (~1468 satır, ~130 alan). Her veri değişiminde `remoteDb` nesnesi baştan klonlanır → `value` referansı değişir → 74 tüketici + alt ağaçları yeniden render olur (hiçbiri `memo` değil). Kanıt: `src/context/AppContext.jsx:108`, `1183-1443`, realtime handler'lar `522-607`.
- **KÖK-2 (GPU/termal):** Sürekli animasyonlu `filter: blur(70px)` orb'lar + üstlerinde onlarca `backdrop-filter: blur()` cam yüzey. Mobil GPU için en pahalı kompozisyon deseni. Kanıt: `src/index.css:570-576`, `AppShell.jsx:55`.
- **KÖK-3 (Uyanık kalan CPU/radyo):** Örtüşen çok sayıda `setInterval` + realtime kanalı, sekme gizliyken bile çalışan bazı poll'lar. Kanıt: `presenceService.js:126,163`, `useRealtimeSync.js:21`, `AppContext.jsx:132`.

---

## 3. Uygulama Sırası (özet tablo)

| Faz | Görev | Öncelik | Zorluk | Beklenen Etki |
|-----|-------|---------|--------|----------------|
| 2 | 2.1 Blur maliyetini düşür | 🔴 Kritik | Düşük | GPU/termal/pil ↓↓↓ |
| 2 | 2.2 Mobilde ambient animasyonu kapat | 🔴 Kritik | Düşük | GPU/pil ↓↓ |
| 1 | 1.2 Kabuk/yaprak bileşenleri `memo`'la | 🔴 Kritik | Düşük | CPU/FPS ↓↓ |
| 3 | 3.1 Poll'ları görünürlüğe bağla | 🟠 Yüksek | Orta | Pil ↓↓ |
| 5 | 5.1 `onApplicationsChange` tam reload'u kaldır | 🟠 Yüksek | Düşük | CPU/ağ ↓ |
| 4 | 4.2 seen-id Set'lerini sınırla | 🟠 Yüksek | Düşük | Bellek ↓ |
| 6 | 6.1 `manualChunks` + `LandingPage` lazy | 🟠 Yüksek | Düşük | Bundle/başlangıç ↓ |
| 1 | 1.1 God-context'i dilimle | 🟡 Orta* | Yüksek | CPU/pil/FPS ↓↓↓ |
| 1 | 1.3 Render içi türetmeleri `useMemo`'la | 🟢 Düşük | Düşük | CPU ↓ |
| 7 | 7.1 Kritik olmayan efektleri ertele | 🟢 Düşük | Düşük | Başlangıç ↓ |

> *1.1 etkisi en yüksek ama risk/emek de en yüksek. Önce hızlı kazanımlar (Faz 2 + 1.2 + 3.1), sonra 1.1.

---

# FAZ 2 — GPU / Termal (önce bunu yap: en yüksek etki, en düşük risk)

## Task 2.1 — Blur maliyetini düşür 🔴

- **Amaç:** Telefonun ısınmasının birincil GPU nedenini gidermek.
- **Kanıt:**
  - `src/index.css:570-576` → `.panel-orb { filter: blur(70px); animation: panelOrbDrift var(--orb-dur,16s) ease-in-out infinite; }`
  - `src/index.css:555-558` → `@keyframes panelOrbDrift { 50% { transform: translate(36px,-28px) scale(1.14);} }`
  - `src/index.css:156,167,256` → `.glass-card`/`.glass-card-solid`/input `backdrop-filter: blur(...)`.
- **Kök neden:** Hareket eden 70px blur her karede büyük bir alanı yeniden rasterize ettirir; üstündeki her `backdrop-filter` öğesi bu bulanık arka planı her karede yeniden örnekler. Fill-rate patlaması → ısı.
- **Yapılacaklar (adım adım):**
  1. `.panel-orb` blur yarıçapını `70px` → **`32px`** düşür (`src/index.css:574`).
  2. `@keyframes panelOrbDrift` içinden **`scale(...)` çıkar**, yalnızca `translate` bırak (`src/index.css:555-558`). Ölçekleme, blur'lu katmanın yeniden rasterizasyonunu tetikler.
  3. Orb sürükleme süresini yavaşlat (görsel his aynı, GPU işi seyrelir): `--orb-dur` kullanımlarında etki minimum, opsiyonel.
- **DOKUNULACAK:** `src/index.css` (yalnızca `.panel-orb` ve `panelOrbDrift` blokları).
- **DOKUNULMAYACAK:** `landing-*` animasyonları, `glass-card` tanımı (2.1'de değil — 2.3 opsiyonel), JSX dosyaları.
- **Zorluk:** Düşük · **Risk:** Düşük (yalnızca görsel yumuşaklık).
- **Kabul kriteri:** Chrome DevTools → Rendering → "Paint flashing" açıkken `/dashboard`'da **boştayken sürekli boyama olmamalı**; FPS metre 60'a yakın kalmalı. Görünüm hâlâ bulanık/atmosferik olmalı.

## Task 2.2 — Mobilde/düşük güçte ambient animasyonu kapat 🔴

- **Amaç:** Panellerde her zaman monteli animasyonlu arka planı mobilde devre dışı bırakmak.
- **Kanıt:**
  - `src/components/layout/AppShell.jsx:55` → `<AnimatedBackground emojis={MEMBER_EMOJIS} accent="member" />` (her zaman monteli).
  - Aynı desen: `src/components/layout/StaffShell.jsx`, `src/components/layout/AdminShell.jsx` (grep ile doğrula).
  - Mevcut yardımcı: `src/hooks/useMediaQuery.js` (kullanılabilir).
  - `src/components/ui/AnimatedBackground.jsx:27-52` → bileşen tanımı.
- **Yapılacaklar:**
  1. `AnimatedBackground.jsx` içinde `useMediaQuery('(min-width: 768px)')` ile masaüstü kontrolü yap; mobilde `return null` (veya animasyonsuz statik gradient döndür).
  2. `prefers-reduced-motion` zaten CSS'te ele alınmış (`src/index.css:578-579`); bunu bozma.
- **DOKUNULACAK:** `src/components/ui/AnimatedBackground.jsx`.
- **DOKUNULMAYACAK:** Shell dosyaları (prop imzası aynı kalsın).
- **Zorluk:** Düşük · **Risk:** Düşük.
- **Kabul kriteri:** Mobil viewport'ta (≤767px) `AnimatedBackground` DOM'a hiç animasyonlu öğe monte etmez (Elements panelinde `.panel-orb`/`.panel-emoji` yok).

## Task 2.3 — (Opsiyonel) Animasyonlu arka plan üstündeki cam yüzeyleri azalt 🟢

- **Amaç:** Hareketli arka plan üstünde `backdrop-filter` yığılmasını azaltmak.
- **Kanıt:** `src/pages/DashboardPage.jsx:171,175,179` → `.glass-card-solid` kartları animasyonlu bg üstünde.
- **Yapılacaklar:** Panel içi kartlarda `backdrop-filter` yerine opak/yarı-opak solid arka plan kullanmayı değerlendir (yalnızca panel bağlamında, landing'de değil).
- **Risk:** Orta (görsel). Kullanıcı onayı olmadan uygulama.

---

# FAZ 1 — Render Optimizasyonu

## Task 1.2 — Kabuk ve yaprak bileşenlerini `React.memo` ile sar 🔴

- **Amaç:** Context değişiminde alakasız alt ağaçların render'ını kesmek.
- **Kanıt:** `React.memo` sıfır kullanım (grep). `src/components/layout/AppShell.jsx:20-23` context'ten 15 alan alır.
- **Yapılacaklar:**
  1. Şu bileşenleri `React.memo` ile sar (props'ları stabil olanlar): `src/components/layout/Sidebar.jsx`, `src/components/layout/TopBar.jsx`, `src/components/ui/AnimatedBackground.jsx`, `src/components/dashboard/ProgressChart.jsx` (export'lar), `src/components/ui/StatsCard.jsx`.
  2. `memo` sarmadan önce her bileşenin **prop'larının stabil** olduğunu doğrula (inline obje/fonksiyon prop'u varsa, önce çağıran tarafta `useMemo`/`useCallback` ile stabilize et; yoksa `memo` işe yaramaz).
- **DOKUNULACAK:** Yukarıdaki bileşenler + gerekiyorsa doğrudan çağıran ebeveyn.
- **DOKUNULMAYACAK:** Context yapısı (bu Task 1.1'de).
- **Zorluk:** Düşük · **Risk:** Düşük.
- **Kabul kriteri:** React DevTools Profiler "Highlight updates" ile: bir sohbet mesajı geldiğinde `Sidebar`/`TopBar` yeniden render OLMAMALI (props değişmediyse).

## Task 1.1 — `AppContext`'i stabil dilimlere ayır 🟡 (en yüksek etki, dikkatli uygula)

- **Amaç:** 74 tüketicinin her veri değişiminde topluca render olmasını durdurmak.
- **Kanıt:**
  - `src/context/AppContext.jsx:1183-1443` → ~130 alanlı tek `value = useMemo`.
  - `src/context/AppContext.jsx:108` → `const db = remoteDb || EMPTY_DB` (her `setRemoteDb`'de yeni referans).
  - Realtime handler'lar her olayda `setRemoteDb((prev)=>({...prev,...}))` yapar: `522-607`.
- **Kök neden:** Tek `value` referansı her mutasyonda değişir; React tüm tüketicilere context güncellemesi yayar.
- **Yapılacaklar (aşamalı, geri alınabilir):**
  1. `value`'yu **3 ayrı context**'e böl:
     - `AuthContext`: `loading, syncing, isAuthenticated, isAdmin, isStaff, user, authUser, membership*` gibi kimlik/oturum alanları.
     - `DataContext`: listeler (`staff, programs, posts, chatThreads, ...`) ve türetilmiş sayaçlar.
     - `ActionsContext`: ~80 `useCallback` aksiyonu (zaten stabil) — bu context değeri **hiç değişmemeli** (ayrı `useMemo`, yalnızca callback bağımlılıkları).
  2. Her context'e kendi `useX()` hook'unu yaz (`useAuth`, `useData`, `useActions`) ve `useApp()`'i bunların birleşimi olarak **geriye dönük uyumlu** bırak (böylece 74 dosyayı tek seferde değiştirmek zorunda kalmazsın).
  3. Tüketicileri **kademeli** olarak dar hook'lara taşı (opsiyonel, ayrı PR'lar).
  4. **Alternatif (kullanıcı onayıyla):** `use-context-selector` ekleyip alan bazlı abonelik. Yeni bağımlılık gerektirir — önce sor.
- **DOKUNULACAK:** `src/context/AppContext.jsx` + (kademeli) tüketiciler.
- **DOKUNULMAYACAK:** İş mantığı, Supabase çağrıları, `hydrate` akışı.
- **Zorluk:** Yüksek · **Risk:** Orta (geniş yüzey). Geriye dönük uyumlu `useApp()` şart.
- **Kabul kriteri:** Gelen tek bir sohbet mesajı yalnızca sohbetle ilgili bileşenleri render eder (DevTools "Highlight updates" ile doğrula). `npm run lint` yeşil. Görünür davranış değişmez.

## Task 1.3 — Render gövdesindeki türetmeleri `useMemo`'la 🟢

- **Kanıt:** `src/pages/DashboardPage.jsx:81-84` → her render'da `posts` filtreleme+sıralama (`latestPosts`).
- **Yapılacaklar:** `latestPosts` hesabını `useMemo(() => ..., [posts])` içine al.
- **DOKUNULACAK:** `src/pages/DashboardPage.jsx`. **Zorluk:** Düşük · **Risk:** Düşük.
- **Kabul kriteri:** `posts` değişmediği sürece sıralama yeniden hesaplanmaz.

---

# FAZ 3 — Zamanlayıcılar / Pil

## Task 3.1 — Poll'ları sekme görünürlüğüne bağla + aralıkları artır 🟠

- **Amaç:** Sekme gizliyken ve genelde radyo/CPU uyanıklığını azaltmak.
- **Kanıt:**
  - `src/services/presenceService.js:163` → `setInterval(beat, 30_000)` (her beat 2-3 sorgu, `65-111`).
  - `src/services/presenceService.js:126-128` → online-stats `setInterval(..., 30_000)`.
  - `src/hooks/useRealtimeSync.js:18-31` → admin aktif kullanıcılar `setInterval(refresh, 15_000)` (görünürlük kontrolü YOK).
  - `src/context/AppContext.jsx:128-143` → single-session `setInterval(tick, 60_000)` (bu zaten `visibilitychange` dinliyor).
- **Yapılacaklar:**
  1. `useActiveUsers` (`useRealtimeSync.js:18-31`) ve `subscribeOnlineStats` (`presenceService.js:120-142`) poll'larını `document.hidden` iken **durdur**, `visibilitychange` ile devam ettir.
  2. Presence heartbeat aralığını `30_000` → **`60_000`** yükselt (`presenceService.js:4` `HEARTBEAT_MS`). OFFLINE_MS ile tutarlılığı koru (`presenceService.js:3`).
- **DOKUNULACAK:** `src/services/presenceService.js`, `src/hooks/useRealtimeSync.js`.
- **DOKUNULMAYACAK:** Realtime kanal abonelik mantığı (`subscribeRealtimeSync`), single-session tick (zaten doğru).
- **Zorluk:** Orta · **Risk:** Orta (presence gecikmesi biraz artar).
- **Kabul kriteri:** Sekme gizliyken (DevTools → arka plan) presence/stats/active-users ağ istekleri **durmalı**; öne gelince devam etmeli.

---

# FAZ 4 — Bellek / Veri Kapsamı

## Task 4.2 — Modül seviyesi "seen-id" Set'lerini sınırla 🟠

- **Kanıt:**
  - `src/hooks/useIncomingChatSound.js:9-11` → `seenThreadsByUser`, `seenMessagesByUser` (Map<userId, Set>). Her mesaj id'si eklenir, hiç temizlenmez.
  - `src/hooks/useNotificationAlerts.js:25-26` → `seenByUser`, `bootstrappedUsers`.
- **Kök neden:** Uzun oturumda Set'ler sınırsız büyür (bellek sızıntısı benzeri artış).
- **Yapılacaklar:** Logout'ta ilgili kullanıcı Set'lerini temizle **veya** boyut sınırı (ör. son 1000 id) uygula. Logout kancası: `AppContext.jsx:719-728` (`logout`).
- **DOKUNULACAK:** `src/hooks/useIncomingChatSound.js`, `src/hooks/useNotificationAlerts.js` (+ gerekiyorsa temizleme çağrısı).
- **Zorluk:** Düşük · **Risk:** Düşük (yanlış temizleme sesi tekrar tetikleyebilir — dikkatli).
- **Kabul kriteri:** Logout sonrası Set'ler sıfırlanır; tekrar login'de "ilk yükleme sessiz" davranışı korunur.

## Task 4.1 — (Büyük / opsiyonel) Hydration'ı role göre daralt 🟡

- **Kanıt:** `src/services/supabaseDb.js:269-364` → tüm members/programs/tickets/activities/payments/applications tek nesneye yüklenir.
- **Not:** RLS ve sorgu değişikliği gerektirir; "milyonlarca kullanıcı" hedefi için gerekli ama **yüksek riskli**. Ayrı bir plan/PR olarak ele al, bu blueprint'te sadece işaret edilir. Kullanıcı onayı olmadan uygulama.

---

# FAZ 5 — Ağ Doğruluğu

## Task 5.1 — `onApplicationsChange` tam reload'unu hedefli patch'e çevir 🟠

- **Kanıt:** `src/context/AppContext.jsx:592-594` → `onApplicationsChange: () => { reloadRemote() }` (tüm veri seti yeniden hydrate).
- **Kök neden:** Herhangi bir application tablosu değişiminde admin tarafında tüm dataset yeniden çekilir.
- **Yapılacaklar:** Diğer handler'lardaki gibi (`onTicketsChange` `521-533`, `onProgramsChange` `595-607`) hedefli `setRemoteDb` patch uygula; ilgili payload'dan tek kaydı upsert et.
- **DOKUNULACAK:** `src/context/AppContext.jsx` (yalnızca `onApplicationsChange` + gerekiyorsa `useRealtimeSync.js` payload iletimi).
- **Zorluk:** Orta · **Risk:** Orta (payload eşleme doğru olmalı).
- **Kabul kriteri:** Application değişiminde tam `hydrate()` çağrısı Network'te görünmez; yalnızca ilgili liste güncellenir.

---

# FAZ 6 — Bundle

## Task 6.1 — `manualChunks` + `LandingPage` lazy 🟠

- **Kanıt:** `vite.config.js:108-113` (manualChunks yok); `src/App.jsx:16` (`LandingPage` eager import).
- **Yapılacaklar:**
  1. `vite.config.js` `build.rollupOptions.output.manualChunks` ekle: `recharts`, `framer-motion`, `@daily-co/daily-js`, `html2pdf.js` ayrı chunk'lara.
  2. `LandingPage`'i `const LandingPage = lazy(() => import('./pages/LandingPage'))` yap (diğer rotalarla tutarlı). `App.jsx:16` + `Suspense` zaten mevcut (`App.jsx:97`).
  3. `stripe` (`package.json:55`) paketinin **client bundle'a girmediğini** doğrula (yalnızca `api/` altında import edilmeli). Girmişse client import'unu kaldır.
- **DOKUNULACAK:** `vite.config.js`, `src/App.jsx`.
- **Zorluk:** Düşük · **Risk:** Düşük.
- **Kabul kriteri:** `npm run build` sonrası `recharts`/`framer-motion`/`daily-js` ayrı chunk dosyaları oluşur; landing artık başlangıç grafiğinde değil. (Ölçüm: `vite build` çıktısı — statik olarak tahmin, çalıştırıp doğrula.)

---

# FAZ 7 — Başlangıç

## Task 7.1 — Kritik olmayan her-zaman-monteli efektleri ertele 🟢

- **Kanıt:** `src/App.jsx:93-96` → `NotificationAudioUnlock`, `GoogleAnalytics` provider ağacında hemen monteli.
- **Yapılacaklar:** GA4 ve audio-unlock'u `requestIdleCallback` / ilk kullanıcı etkileşimine ertele. GA zaten KVKK onayına bağlı (`index.html:34`, `src/utils/ga4Loader.js`) — bunu bozma, yalnızca yükleme anını geciktir.
- **DOKUNULACAK:** `src/components/analytics/GoogleAnalytics.jsx`, `src/components/notifications/NotificationAudioUnlock.jsx`.
- **Zorluk:** Düşük · **Risk:** Düşük.
- **Kabul kriteri:** İlk boyamada GA/audio init ana iş parçacığını bloklamaz; onay/etkileşim sonrası yüklenir.

---

## 8. Doğrulama Yöntemleri (ajan bunları kullansın)

1. **Render fırtınası:** React DevTools → Profiler → "Highlight updates when components render". Bir sohbet mesajı gönder; hangi bileşenlerin yandığını kaydet (öncesi/sonrası).
2. **Boyama/GPU:** Chrome DevTools → More tools → Rendering → "Paint flashing" + "Frame Rendering Stats". `/dashboard` boşta sürekli boyama olmamalı.
3. **Zamanlayıcılar:** Network paneli; sekmeyi gizle (başka sekmeye geç); presence/stats isteklerinin durduğunu doğrula.
4. **Bundle:** `npm run build`; chunk çıktısını kontrol et. (Opsiyonel: `rollup-plugin-visualizer` — yeni dev bağımlılığı, önce sor.)
5. **Lint:** her görev sonrası `npm run lint`.

---

## 9. Statik Olarak DOĞRULANAMAYAN (dürüstlük notu)

Bu metrikler runtime ölçüm gerektirir; ajan bunları "tamamlandı" olarak işaretlemeden önce ölçmelidir:

- Gerçek bundle boyutları / chunk grafiği (`vite build` gerekli — çalıştırılmadı).
- Gerçek FPS, zamanla bellek artışı, flame chart (Chrome profiling gerekli).
- `stripe`/`html2pdf.js`'in gerçekten client bundle'a girip girmediği (import grafiği kontrolü gerekli).
- Beklenen iyileşme yüzdeleri (CPU ↓40-70%, pil ↓30-50%, bellek ↓30-60%) → **tahmindir**, ölçümle doğrula.

---

## 10. Değişiklik Günlüğü

| Tarih | Faz/Görev | Durum | Not |
|-------|-----------|-------|-----|
| 2026-07-14 | 1.1 | ✅ | Auth/Data/Actions context dilimleri; `useAuth`/`useData`/`useActions`; `useApp` birleşik. Sidebar/TopBar → `useAuth`(+actions); rozet sayaçları Auth’ta |
| 2026-07-14 | 2.3 | ✅ | Panel bg içinde `.glass-card*` backdrop-filter kapalı (opak yüzey); landing camı aynı |
| 2026-07-14 | 7.1 | ✅ | GA + NotificationAudioUnlock idle/ilk etkileşim sonrası arm |
| 2026-07-14 | follow-up | ✅ | Logo 342→12 KB webp; recharts entry sızıntısı düzeltildi (react-vendor + modulePreload filter); font weight azaltıldı. LH: mobile 65→89, LCP 6.6→3.1s, desktop 98→100 |
| 2026-07-14 | 2.1 | ✅ | `.panel-orb` blur 70→32px; `panelOrbDrift` scale kaldırıldı |
| 2026-07-14 | 2.2 | ✅ | `AnimatedBackground` mobilde (`<768px`) `null` döner |
| 2026-07-14 | 1.2 | ✅ | Sidebar/TopBar/AnimatedBackground/StatsCard/ProgressChart `memo`; Dashboard onClick `useCallback` · kabuk sonradan `useAuth` (1.1) |
| 2026-07-14 | 1.3 | ✅ | `DashboardPage` `latestPosts` → `useMemo([posts])` |
| 2026-07-14 | 3.1 | ✅ | Presence heartbeat 60s / OFFLINE 180s; stats + active-users poll `document.hidden`'da durur |
| 2026-07-14 | 5.1 | ✅ | `onApplicationsChange` hedefli upsert/delete; tam `reloadRemote` kaldırıldı |
| 2026-07-14 | 4.2 | ✅ | seen-id Set cap 1000 + logout'ta `clearIncomingChatSoundState` / `clearNotificationAlertState` |
| 2026-07-14 | 6.1 | ✅ | `manualChunks` (recharts/framer-motion/daily-js/html2pdf); `LandingPage` lazy; stripe yalnızca `api/` |
| 2026-07-14 | — | Audit oluşturuldu | Henüz uygulama yok |
