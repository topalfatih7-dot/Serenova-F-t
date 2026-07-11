# Lint — kritik React Hooks düzeltmeleri (2026-07-11)

> **Amaç:** `react-hooks/purity`, `set-state-in-effect`, `exhaustive-deps` temizliği.  
> **Kural:** Akış/UX bozulmasın; kör `eslint-disable` yok.  
> **Baseline (önce):** commit `238a7166` — ~129 problem; bu üç kuralda ~49 bulgu.  
> **Sonra:** Bu üç kural = **0**; toplam lint ~85 (çoğu `no-unused-vars` / `react-refresh` — ayrı faz).

---

## Tam geri alma

```bash
# Tüm hooks turunu geri al (bu dosyadaki src değişiklikleri)
git checkout 238a7166 -- \
  src/components/calendar/SessionBooker.jsx \
  src/components/landing/PromoBanner.jsx \
  src/components/landing/TestimonialCarousel.jsx \
  src/components/layout/PublicLayout.jsx \
  src/components/profile/VerificationSection.jsx \
  src/components/support/SupportForm.jsx \
  src/components/ui/OnboardingTutorial.jsx \
  src/context/AppContext.jsx \
  src/hooks/useChatPresence.js \
  src/hooks/useDailyCall.js \
  src/hooks/useExerciseLibrary.js \
  src/hooks/useHealthAnalysisSync.js \
  src/hooks/useInView.js \
  src/hooks/usePlatformDisplayStats.js \
  src/hooks/useRealtimeSync.js \
  src/pages/CalendarPage.jsx \
  src/pages/OnboardingPage.jsx \
  src/pages/ProfilePage.jsx \
  src/pages/VideoCallPage.jsx \
  src/pages/admin/AdminContentPage.jsx \
  src/pages/admin/AdminMessagesPage.jsx \
  src/pages/admin/AdminPremiumPage.jsx \
  src/pages/auth/AuthCallbackPage.jsx \
  src/pages/auth/ResetPasswordPage.jsx \
  src/pages/staff/StaffCollabMessagesPage.jsx \
  src/pages/staff/StaffMessagesPage.jsx

# Commit edildiyse:
git revert <lint-hooks-commit-hash>
```

Tek dosya geri alma: `git checkout 238a7166 -- <path>`

---

## Özet strateji (React docs)

| Kural | Yaklaşım |
|-------|----------|
| **purity** | Render’da `Date.now()` yok → `useState` + interval ile `now` |
| **set-state-in-effect** | Lazy `useState` init; event handler’da reset; “props değişince render sırasında state ayarla”; effect’te yalnızca await sonrası setState |
| **exhaustive-deps** | Stabil `EMPTY_*`; gereksiz dep sil; gerçek eksikleri ekle |

---

## Dosya bazlı değişiklikler

### `SessionBooker.jsx` — purity + set-state + deps
- **Önce:** Render/slot’ta `Date.now()`; `open`/`selectedIdx` effect’leriyle reset.
- **Sonra:** `now` state (60s tick); gün tıklanınca `setPendingTime(null)`; `open` için render-time adjust; `EMPTY_AVAIL`.
- **Risk:** Saat dilimi / “geçmiş slot” mantığı aynı; tick 60s.

### `PromoBanner.jsx`
- **Önce:** mount effect → `localStorage` → `setVisible`.
- **Sonra:** `useState(() => localStorage…)`.
- **Risk:** Vite SPA; SSR yok.

### `OnboardingTutorial.jsx`
- **Önce:** effect ile `setVisible(true)`.
- **Sonra:** `userId`/`seen` değişince render-time adjust + localStorage.

### `ResetPasswordPage.jsx`
- **Önce:** effect başında `setStatus('invalid')` if no supabase.
- **Sonra:** initial state `'invalid'` | `'loading'`.

### `AuthCallbackPage.jsx`
- **Önce:** success effect’inde sync `setCountdown(10)` + interval.
- **Sonra:** `phase` değişince render-time adjust ile countdown; effect yalnız interval.
- **Smoke:** e-posta/OAuth başarı ekranı → 10 sn geri sayım → panele git.

### `VideoCallPage.jsx`
- **Önce:** effect’te `setMeetingToken('')` when not configured.
- **Sonra:** `canFetchToken`; token yalnız fetch path’te; `useDailyCall`’a `canFetchToken ? meetingToken : ''`.
- **Smoke:** üyе/staff video oda; yapılandırılmamış ortamda boş token.

### `AppContext.jsx`
- **loading:** `useState(isSupabaseEnabled)` — kapalıyken effect’te `setLoading(false)` kaldırıldı.
- **Chat clear:** oturum yokken effect setState yerine render-time adjust (`hasChatSession`).
- **Chat hydrate deps:** `[chatHydrationKeyString, hasChatSession]`.
- **Risk:** chat hydrate gövdesi korunur; logout’ta thread temizliği render-time.

### `PublicLayout.jsx` / `VerificationSection.jsx` / `SupportForm.jsx`
- prop/pathname sync → render-time adjust.

### `useInView.js`
- `enabled === false` → `false`; `IntersectionObserver` yok → `true` (setState yok).
- Observer path aynı.

### `useExerciseLibrary.js`
- **Önce:** effect → `load()` → sync `setLoading(true)`.
- **Sonra:** effect yalnız await sonrası setState; `setLoading(true)` page/filter/sort/refresh handler’larında; initial `loading: true`.
- **Smoke:** kütüphane sayfa/filtre/sıralama; refresh.

### `useRealtimeSync.js` (`useActiveUsers`)
- **Önce:** effect başında sync `refresh()` → setState.
- **Sonra:** `setTimeout(0)` ile ilk refresh (poll/realtime aynı).

### `useHealthAnalysisSync.js`
- **Önce:** granular `user?.id` vb. → exhaustive-deps warning.
- **Sonra:** `user` bütünü dep (stale closure yok).
- **Risk:** user referansı sık değişirse sync tekrar denenebilir; `syncing` + hasSummary/stale guard korur.

### `CalendarPage.jsx` / `OnboardingPage.jsx` / `ProfilePage.jsx`
- Stabil boş koleksiyonlar; avail modal / pkg derived state; gereksiz effect reset’ler kaldırıldı.

### `TestimonialCarousel.jsx` / `AdminContentPage.jsx` / `AdminMessagesPage.jsx` / `AdminPremiumPage.jsx`
- deps / sync setState temizliği (ör. sessionsLoading sync set kaldırıldı).

### Staff mesaj sayfaları / `useChatPresence` / `useDailyCall` / `usePlatformDisplayStats`
- `effectiveThreadId` / gereksiz clear effect; deps düzeltmeleri.

---

## Bilinçli dokunulmayan (bu tur)

- `react-refresh/only-export-components`
- `no-unused-vars` / `no-control-regex`
- VideoPlayer / auth güvenlik akışının iş mantığı (yalnız hooks kalıpları)

---

## Doğrulama

```bash
npm run lint
# Hedef: react-hooks/purity | set-state-in-effect | exhaustive-deps → 0 eşleşme
```

Manuel smoke:
1. Randevu al — geçmiş saat disabled; gün değişince seçim sıfırlanır; modal tekrar açılınca sıfırlanır.
2. Landing promo dismiss kalıcı.
3. Takvim `?avail=1` → müsaitlik modalı.
4. Auth callback başarı → countdown → panel.
5. Video call token (yapılandırılmış ortam).
6. Hareket kütüphanesi filtre/sayfa.
7. Chat: giriş/çıkış, thread hydrate.
8. Public nav — sayfa değişince dropdown kapanır.

---

## Commit notu (istenirse)

Henüz commit edilmedi. Kullanıcı isterse ayrı commit; mesaj örneği:

`fix: react-hooks purity / set-state-in-effect / exhaustive-deps`
