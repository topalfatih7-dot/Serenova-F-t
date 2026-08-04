# Yeni Form — Denetim Yol Haritası

> **Güncelleme:** 2026-08-02 · **Durum:** Web-only (mobil/Expo bu repoda yok); freemium SoT  
> Cursor plan: `.cursor/plans/faz2-3_denetim_1af5899b.plan.md` · Tarama: [`TAM_TARAMA_RAPORU.md`](TAM_TARAMA_RAPORU.md) · Google OAuth marka: [`OPS_GOOGLE_OAUTH.md`](OPS_GOOGLE_OAUTH.md) · Facebook: [`OPS_FACEBOOK_OAUTH.md`](OPS_FACEBOOK_OAUTH.md)  
> Mobil: bu repo yalnızca web; Expo handoff kaldırıldı.

---

## AÇIK OPS — kullanıcı (kritik)

- [ ] **Stripe webhook event’leri** — Dashboard’a `invoice.paid` + `customer.subscription.deleted` ekle (kod hazır; eklenmezse abonelik yenilenmez). Adım adım: [`OPS_STRIPE_WEBHOOK.md`](OPS_STRIPE_WEBHOOK.md)  
- [x] **Resend e-posta (kod + env)** — API key, domain verified, Vercel env, `staff_decision_notify` production’da. Kalan manuel: Supabase şablon subject/HTML. [`OPS_RESEND_MAIL.md`](OPS_RESEND_MAIL.md)  
- [ ] **Google OAuth markalama** — Consent Screen + Custom Domain (`auth.yeniform.com`). Adım adım: [`OPS_GOOGLE_OAUTH.md`](OPS_GOOGLE_OAUTH.md)  
- [ ] **Facebook OAuth** — Meta app (Login) + Supabase Providers; Development smoke → Live. Kod hazır. Adım adım: [`OPS_FACEBOOK_OAUTH.md`](OPS_FACEBOOK_OAUTH.md)  
- [ ] **WhatsApp Cloud API** — Meta şablon onayı + env + webhook. Kod hazır. Adım adım: [`OPS_WHATSAPP.md`](OPS_WHATSAPP.md)  
- [x] GSC mülk + sitemap — `yeniform.com` doğrulu, sitemap **Başarılı** (67 sayfa)

---

## Faz durumu

| Faz | Konu | Durum |
|-----|------|--------|
| 0 | WIP stabilize + bu roadmap kaydı | Tamamlandı (2026-07-17) |
| 1 | Güvenlik & ödeme bütünlüğü (RLS, plan yazımı, payments, AI food, admin email) | Tamamlandı (2026-07-17) |
| 1b | Paid-only model · AI program kaldırma · staff builders · GPT sağlık skoru | Tamamlandı (2026-07-28/29) |
| 2 | Paketsiz üye lock · Stripe Customer Portal · dürüst ürün (kısmi copy) | Tamamlandı (2026-07-29) |
| 3 | Attendance → hakediş · AI orphan cleanup | Tamamlandı (2026-07-29) |
| 4 | Aktivasyon funnel (metrik + GA4 + checklist) | Tamamlandı (2026-07-29) |
| 5 | Stripe Subscription otomatik yenileme | Tamamlandı (2026-07-29) |

---

## 2026-07-28 / 29 delta (ürün)

- AI Basic/Eko program+diyet üretimi kaldırıldı; koç/diyetisyen builder + admin program CRUD.
- Freemium: ücretsiz kayıt + soft-lock; eski tek `eko` yeni satış kapalı. Satılan: `eko_diyet` / `diyet` / `eko_spor` / `spor` / `doktor` / `vip`.
- Staff GPT-5.4 sağlık skoru + `staffBrief`; üye dashboard `HealthScoreCard` (brief yok).
- Pazarlama / legal copy paid-only modele hizalandı (2026-07-28).
- Faz 2–3: `UnpaidMemberGate`, Stripe Portal (`stripe_customer_id`), `staff_earnings` + video attendance.

---

## Kritik bulgular (özet) — Faz 1 sonrası durum

| # | Bulgu | Durum |
|---|--------|--------|
| 1 | İstemci ücretli plan aktivasyonu | Düzeltildi (Faz 1) |
| 2 | `members_update` RLS | Düzeltildi (Faz 1) |
| 3 | AI kalori plan guard | Düzeltildi (Faz 1) |
| 4 | `payments_insert` spoof | Düzeltildi (Faz 1) |
| 5 | Admin email drift | Düzeltildi (Faz 1) |
| 6 | Hakediş mock / `sessionAttendance` / `aiAnalysis` orphan | Düzeltildi (Faz 3) |
| 7 | Yarım trial duvarı / pazarlama vaatleri | Paketsiz lock + kısmi copy (Faz 2); video katmanı **program-scoped** (2026-07-29) |

---

## Faz 1 checklist

- [x] `docs/ROADMAP_DENETIM.md` kaydı
- [x] Migration: üye privileged kolon/data koruması + payments insert
- [x] Migration: `platform_settings.admin_email` + `is_admin()` senkronu
- [x] Client: ücretli plan yazımını engelle (Stripe/webhook/admin)
- [x] `api/ai-food-*` plan guard
- [x] `.env.example` / rehber notu

## Faz 2 checklist

- [x] Paketsiz üye lock (`UnpaidMemberGate`) — tüm kritik üye paneli
- [x] Stripe Customer Portal (`action: create-portal-session` → `stripe-checkout`)
- [x] `members.stripe_customer_id` + webhook persist
- [x] Paid-only pazarlama/legal copy (2026-07-28)
- [x] Video kütüphanesi vs pazarlama nihai karar — **program-scoped** (üye yalnız kendi programındaki videolar; SEO/onboarding copy hizalandı, 2026-07-29)

## Faz 3 checklist

- [x] `aiAnalysis.js` orphan silindi
- [x] Video join/leave → attendance → `staff_earnings`
- [x] Staff payments UI gerçek veri; `MOCK_STAFF_EARNINGS` kaldırıldı
- [x] Admin hakediş onay/ödeme işaretleme

## Faz 4+ (sonra)

- [x] Aktivasyon funnel (2026-07-29): Admin Analytics hunisi (program + randevu), GA4 `sign_up` / `begin_checkout` / `purchase` / `health_test_complete`, dashboard `ActivationChecklist`
- [x] Stripe Subscription otomatik yenileme (2026-07-29): recurring planlar `mode: subscription` + `invoice.paid` yenileme; doktor `payment`; iptal Portal
- [ ] **Manuel:** Stripe Dashboard webhook event’leri (`invoice.paid`, `customer.subscription.deleted`) — [`OPS_STRIPE_WEBHOOK.md`](OPS_STRIPE_WEBHOOK.md)
- [x] `eko` DB temizliği — 0 üye; plan `is_active/is_sellable=false` (JS legacy okuma saklandı)
- [x] Expo/mobil handoff bu web reposundan kaldırıldı (2026-08-02)
- [x] GSC ops — mülk + sitemap Başarılı (2026-07-29); checklist dosyası kaldırıldı (tamamlandı)
- [x] Yasal ince ayar: üyelik + iptal metinleri freemium / Eko paketler / Subscription Portal (2026-07-29; 2026-08-02 freemium hizası)
- [x] Admin FAQ kopya hizası (paketler + freemium + kalori hakları; SEO static FAQ aynı)

Detay: [`AI_PROJE_REHBERI.md`](../AI_PROJE_REHBERI.md).

---

## Tam ürün tarama (2026-07-29) — Faz 4 öncesi

Kanıta dayalı envanter + ölü kod + UX + gap listesi: [`docs/TAM_TARAMA_RAPORU.md`](TAM_TARAMA_RAPORU.md).

**Tarama sonucu (özet):**

- DB: aktif `eko` üye **0** (cleanup için uygun).
- P0 adayları: SEO `/online-*` hydrate pass-through eksik; Supabase `members_staff_safe` SECURITY DEFINER advisor ERROR; anon/authenticated EXECUTE WARN’lar.
- P1 (çoğu kapandı 2026-08-02): freemium + UnpaidMemberGate SoT; stats floor kaldırıldı; `fullVideo` entitlement koddan silindi (program-scoped video).
- Ölü export (0 çağrı): `shouldAutoplayExerciseVideo`, `getHealthPackageContext`, `buildCoachProgramPayload`.
- Uygulama sırası: Tur 1 P0 → Tur 2 ölü kod → Tur 3 UX → Tur 4 Faz 4/5 (ürün onayı).

### Tur 1–3 uygulandı (2026-07-29)

Kararlar: istatistik floor **tutuldu**; kütüphane **program-scoped kaldı**; Faz 4/Subscription **hariç**.

| Tur | Yapılan |
|-----|---------|
| 1 | `authPaths` ← `/online-diyetisyen`, `/online-kocluk`; `members_staff_safe` → `security_invoker` (advisor ERROR kapandı). Anon/authenticated EXECUTE WARN’lar bilinçli (RLS/`phone_in_use`/landing stats). |
| 2 | Silindi: `shouldAutoplayExerciseVideo`, `getHealthPackageContext`, `buildCoachProgramPayload`, `applyStaffAssignments` → `assignStaffOnly` |
| 3 | `/schedule` + unpaid kalori → `UnpaidMemberGate`; landing CTA “Ücretsiz Başla”; SEO/onboarding copy program-scoped |

### Faz 4 uygulandı (2026-07-29)

- Admin Analytics hunisi: +program +randevu adımları
- GA4: `sign_up`, `begin_checkout`, `purchase`, `health_test_complete`
- Üye dashboard `ActivationChecklist` (HT → plan / randevu / program)

### Faz 5 + eko cleanup (2026-07-29)

- Recurring checkout → Stripe Subscription (`interval_count` = 1/3/6 ay); `invoice.paid` süre uzatır
- Doktor paketi → `mode: payment` (tek seferlik)
- Webhook: `customer.subscription.deleted` → `stripeSubscriptionId` temizliği
- **Ops:** Stripe Dashboard webhook’a `invoice.paid` + `customer.subscription.deleted` ekleyin (mevcut `checkout.session.*` kalsın)
- `eko` plan pasif / satış kapalı; üye 0

### Personel ↔ üye akış denetimi (2026-07-31)

- Tur 1–8 uygulandı: atama banner/profil; program empty ayrımı; randevu `pending`→onay/red; üçlü collab; brief+audience filtre; lab RLS; doktor min nav + Sonraki Doktor.
- Sonraya: staff adherence, doktor hakediş, lab UI, pazarlama copy — [`STAFF_MEMBER_FLOWS_ILERI_FAZ.md`](STAFF_MEMBER_FLOWS_ILERI_FAZ.md)
