# Yeni Form — Denetim Yol Haritası

> **Kaynak:** 2026-07-17 proje denetimi · **Güncelleme:** 2026-07-29  
> **Durum:** Faz 0–1 tamam · Faz 2–3 uygulama (2026-07-29) · Faz 4–5 bekliyor  
> Cursor plan: `.cursor/plans/faz2-3_denetim_1af5899b.plan.md`

---

## Faz durumu

| Faz | Konu | Durum |
|-----|------|--------|
| 0 | WIP stabilize + bu roadmap kaydı | Tamamlandı (2026-07-17) |
| 1 | Güvenlik & ödeme bütünlüğü (RLS, plan yazımı, payments, AI food, admin email) | Tamamlandı (2026-07-17) |
| 1b | Paid-only model · AI program kaldırma · staff builders · GPT sağlık skoru | Tamamlandı (2026-07-28/29) |
| 2 | Paketsiz üye lock · Stripe Customer Portal · dürüst ürün (kısmi copy) | Tamamlandı (2026-07-29) |
| 3 | Attendance → hakediş · AI orphan cleanup | Tamamlandı (2026-07-29) |
| 4 | Aktivasyon & büyüme | Bekliyor |
| 5 | İsteğe bağlı ileri | Bekliyor |

---

## 2026-07-28 / 29 delta (ürün)

- AI Basic/Eko program+diyet üretimi kaldırıldı; koç/diyetisyen builder + admin program CRUD.
- Ücretsiz kayıt kapalı; eski tek `eko` yeni satış kapalı. Satılan: `eko_diyet` / `diyet` / `eko_spor` / `spor` / `doktor` / `vip`.
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
| 7 | Yarım trial duvarı / pazarlama vaatleri | Paketsiz lock + kısmi copy (Faz 2); video katmanı kararı açık |

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
- [ ] Video kütüphanesi vs pazarlama nihai karar (açık)

## Faz 3 checklist

- [x] `aiAnalysis.js` orphan silindi
- [x] Video join/leave → attendance → `staff_earnings`
- [x] Staff payments UI gerçek veri; `MOCK_STAFF_EARNINGS` kaldırıldı
- [x] Admin hakediş onay/ödeme işaretleme

## Faz 4+ (sonra)

- Aktivasyon funnel
- Stripe Subscription otomatik yenileme (şu an Checkout one-shot + Portal kart/fatura)
- `eko` DB temizliği (aktif eko üye kalmayana kadar)
- Expo mobil (repo dışı)

Detay: [`AI_PROJE_REHBERI.md`](../AI_PROJE_REHBERI.md).
