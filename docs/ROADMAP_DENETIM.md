# Yeni Form — Denetim Yol Haritası

> **Kaynak:** 2026-07-17 proje denetimi  
> **Durum:** Faz 0–1 uygulama / Faz 2–5 bekliyor  
> Cursor plan: `.cursor/plans/proje_denetim_raporu_d3d6562c.plan.md`

---

## Faz durumu

| Faz | Konu | Durum |
|-----|------|--------|
| 0 | WIP stabilize + bu roadmap kaydı | Tamamlandı (2026-07-17) |
| 1 | Güvenlik & ödeme bütünlüğü (RLS, plan yazımı, payments, AI food, admin email) | Tamamlandı (2026-07-17) |
| 2 | Paket gating & dürüst ürün (trial gate, video, rapor vaadleri, copy) | Bekliyor |
| 3 | Kopuk sistemler (attendance→hakediş, Portal, AI cleanup) | Bekliyor |
| 4 | Aktivasyon & büyüme | Bekliyor |
| 5 | İsteğe bağlı ileri | Bekliyor |

---

## Kritik bulgular (özet)

1. İstemci tarafı ücretli plan aktivasyonu (`changeMemberPlan` / `registerWithPlan`)
2. `members_update` RLS — üyelik/atama alanları korunmuyordu
3. AI kalori API’lerinde sunucu plan kontrolü yoktu
4. `payments_insert` üye tarafından spoof edilebilir
5. Admin email drift (env vs `is_admin()`)
6. Hakediş mock; `sessionAttendance` bağlı değil; `aiAnalysis` orphan
7. Pazarlama vs gerçek: video katmanları, raporlar, kan tahlili, yarım trial duvarı

---

## Faz 1 hedef checklist

- [x] `docs/ROADMAP_DENETIM.md` kaydı
- [x] Migration: üye privileged kolon/data koruması + payments insert (`20260717_member_security_guards.sql`)
- [x] Migration: `platform_settings.admin_email` + `is_admin()` senkronu
- [x] Client: ücretli plan yazımını engelle (Stripe/webhook/admin)
- [x] `api/ai-food-*` plan guard (`api/_memberEntitlements.js`)
- [x] `.env.example` / rehber notu

## Faz 2+ (sonra)

- FreeTrial gate tüm üye paneli
- Video kütüphanesi vs pazarlama kararı
- sessionAttendance → hakediş
- Stripe Customer Portal
- AI orphan cleanup / takvim hizası
- Aktivasyon funnel

Detaylı mimari ve dosya listesi için ana plan dosyasına bakın.
