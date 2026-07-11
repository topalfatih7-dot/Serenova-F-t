# Lint — kalan hataların temizliği (2026-07-11)

> **Önceki tur:** [`LINT_HOOKS_FIX_2026-07-11.md`](./LINT_HOOKS_FIX_2026-07-11.md) — purity / set-state-in-effect / exhaustive-deps  
> **Bu tur:** kalan ~85 hata → **0** (`npm run lint` temiz)  
> **Baseline:** `b6ab29af` (hooks turu commit’i)

---

## Tam geri alma

```bash
# Bu turdaki tüm değişiklikleri geri al (commit edilmeden önce)
git checkout b6ab29af -- .
git clean -fd -- src/components/calendar/memberScheduleLimits.js \
  src/components/package/supportScheduleConstants.js \
  src/components/staff/staffApplicationUiStyles.js \
  src/pages/staff/staffAppointments.js \
  docs/LINT_FULL_FIX_2026-07-11.md

# Commit edildiyse:
git revert <lint-full-commit-hash>
```

Tek dosya: `git checkout b6ab29af -- <path>`

---

## Özet (kural → yaklaşım)

| Kural | Sayı (~) | Yaklaşım |
|-------|----------|----------|
| `no-unused-vars` | ~54 | `eslint.config`: `^_` + `ignoreRestSiblings`; gerçek unused import/var silindi |
| `react-refresh/only-export-components` | ~14 | `allowConstantExport`; context `useApp`/`useToast`; helper’lar ayrı dosyaya |
| `react-hooks/refs` | ~11 | `ref.current = x` → `useEffect` (React docs) |
| `react-hooks/static-components` | 1 | `MotionLink = motion(Link)` bileşen dışında |
| `react-hooks/preserve-manual-memoization` | 2 | Deps derleyiciyle hizalandı |
| `no-control-regex` | 2 | E-posta sanitize: codePoint döngüsü (regex literal yok) |
| `no-undef` | 1 | `AdminContentPage` `lists` tanımı (gerçek bug) |
| `no-useless-assignment` | 1 | NutritionBuilder `scoped` init |

---

## ESLint config (`eslint.config.js`)

- `no-unused-vars`: `argsIgnorePattern/varsIgnorePattern/caughtErrorsIgnorePattern/destructuredArrayIgnorePattern: '^_'`, `ignoreRestSiblings: true`  
  → API/member row’daki `assignedCoachId: _c, ...rest` ve `stripOptionalExerciseColumns` bilinçli atmalar.
- `react-refresh/only-export-components`: `allowConstantExport: true`
- `src/context/**`: `allowExportNames: ['useApp', 'useToast']` (Provider + hook kalıbı)

---

## Yeni dosyalar (HMR / export ayrımı)

| Dosya | İçerik | Eski konum |
|-------|--------|------------|
| `src/components/calendar/memberScheduleLimits.js` | `coach/dietitian/doctorMonthlyLimit`, `doctorLimitLabel` | `MemberScheduleView.jsx` |
| `src/components/package/supportScheduleConstants.js` | `WEEKDAYS`, `TIME_OPTIONS`, `DEFAULT_SUPPORT_SCHEDULE`, `weekdayLabel` | `SupportScheduler.jsx` |
| `src/pages/staff/staffAppointments.js` | `getStaffAppointments` | `StaffOverviewPage.jsx` |
| `src/components/staff/staffApplicationUiStyles.js` | `TONE_STYLES` | `StaffApplicationUi.jsx` |

Import güncellemeleri: Coach/Doctor/Dietitian/Appointments sayfaları; StaffFormModal, NutritionProgramBuilder, StaffProfileDisplay, StaffClientsPage, StaffOverviewPage.

---

## Kritik kod düzeltmeleri

### Gerçek bug
- **`AdminContentPage.jsx`:** Tab badge’de `lists[t.id]` tanımsızdı → `lists = { testimonials, faqs, successStories }`.

### Refs (`react-hooks/refs`)
- **`AppContext`:** `remoteDbRef` / `memberRef` / `sessionTypeRef` sync → effect; chat ref clear → `hasChatSession` effect (state clear hâlâ render-time adjust).
- **`HealthTestFlow`:** `healthTestRef` / `onProgressSaveRef` → effect.
- **`AuthCallbackPage`:** `refreshRef` → effect.

### Diğer
- **`MembershipPlanCard`:** `MotionLink` module-scope.
- **`CalendarPage`:** `openExerciseDetail` deps `[setDetailExercise]`.
- **`AppContext`:** `isFreeTrialExpired` deps `[currentMember]`.
- **E-posta sanitize** (`emailAddress.js`, `api/_email.js`): control char strip codePoint ile; davranış aynı.
- Unused: import/var temizliği (`supabaseDb` `roleForEmail`, paket import’ları, StaffApplication icons, vb.).
- **`ChatCollapsiblePrograms`:** `filterProgramsByRole` artık private (yalnız dosya içi).

---

## Doğrulama

```bash
npm run lint   # 0 problems
```

Manuel smoke (önerilir):
1. Admin içerik sekmeleri — sayı badge’leri doğru.
2. Üyelik plan kartı (select + link mode).
3. Auth callback / OAuth refresh path.
4. Chat: logout → thread temiz; login → hydrate.
5. Sağlık testi progress save.
6. Staff overview / clients randevu listesi.
7. Randevu limitleri (koç/diyet/doktor sayfaları).
8. E-posta alanına yapıştırılan gizli karakterler temizlenir.

---

## Commit notu (istenirse)

`fix: kalan lint hatalarını temizle (refs, unused, react-refresh, email sanitize)`
