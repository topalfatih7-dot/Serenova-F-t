# IMPLEMENTATION LOCK — mobil

Bu dosya, agent / geliştirici **uydurmasını engeller**. Çelişki varsa LOCK kazanır.

## Yasaklar

1. Web’de olmayan plan ID’si, gate veya AI özelliği icat etme.  
2. Ücretli planı istemci tarafında “açma” (yalnızca Stripe webhook / admin / RevenueCat → `members`).  
3. Program / diyet listesi AI üretimi yok (2026-07-28 kaldırıldı).  
4. Üye kütüphanesi = **program-scoped** hareket videoları (tam katalog değil).  
5. Personel üye e-posta/telefon görmez (`members_staff_safe`).  
6. Yeni `api/*.js` dosyası yok (Vercel Hobby 12/12) — multiplex `action`/`task`.  
7. Türkçe UI kopyası web ile parity; “daha iyi İngilizce” ile değiştirme.

## Plan ID’leri (satış)

`eko_diyet` | `diyet` | `eko_spor` | `spor` | `doktor` | `vip`  
`free` = ücretsiz kayıt (+48s deneme) veya süresi bitmiş fallback.  
Eski `eko` = satış kapalı.

## Paketsiz / deneme gate

| Yüzey | `free` + aktif 48s deneme | `free` deneme bitmiş | Ücretli aktif |
|-------|---------------------------|----------------------|---------------|
| Dashboard + skorlar | açık | gate | açık |
| Health test | açık (AI 1×) | kayıt açık, AI yok | açık |
| Calendar / messages / programs / library / schedule | gate | gate | açık (haklara göre) |
| Calorie | entitlement | entitlement | plana göre |
| Profile / support / notifications / membership | açık | açık | açık |

`isUnpaidMember` = `membership === 'free'` (denemede de true).  
`canAccessMemberDashboard` = ücretli VEYA aktif deneme.

## Ödeme

- Web: Stripe Subscription (recurring); doktor `payment`. Portal iptal.  
- Mobil: RevenueCat IAP; entitlement yazımı Stripe webhook ile aynı alanlara.

## Video

- Storage: `exercise-videos` private; imzalı URL ≤15 dk.  
- `video_pending` iken signed URL yok.

## Değişiklik prosedürü

Ürün kuralı değişince: önce web + bu LOCK + ilgili `domains/*` aynı PR’da güncellenir.
