# Yeni Form — GSC playbook

Kaynak: `yeniform.com-Performance-on-Search-2026-08-31.xlsx` (Web, son 3 ay: 2026-06-21 → 2026-08-29).

## Gerçek tablo (3 ay)

| | |
|--|--|
| Tıklama | ~194 (TR 193) |
| Gösterim | ~1.026 |
| Marka tıklama | `yeniform` 84 + `yeni form` 12 — neredeyse tüm tıklama |
| Ticari tıklama | ~4 (`/online-diyetisyen/fiyat`) + birkaç hizmet/blog |

Ağustos ortası gösterim 5–15/gün → 30–90/gün; TO %40+ → %3–8. Google ticari sorgularda göstermeye başladı; snippet ve silo henüz tıklatmaıyor.

## Silo (ihlal etme)

| Sorgu ailesi | Tek sahip | Çalmasın |
|--------------|-----------|----------|
| online diyetisyen, online diyet, online diyetisyen platformu | `/online-diyetisyen` | membership title, fiyat H1, kadro listesi title, fiyat blog |
| online diyetisyen fiyatları/ücretleri, diyetisyen fiyat, paket fiyatları | `/online-diyetisyen/fiyat` | `/membership` title, pillar keywords |
| online koçluk, online coaching ne demek, online fitness koçu | `/online-kocluk` | membership H1 |
| evde antrenman | `/online-kocluk/ev-antrenman` | — |
| kilo verme / online zayıflama | `/kilo-verme` | homepage H1 |
| PCOS / polikistik | `/beslenme/pcos` | — |
| insülin direnci | `/beslenme/insulin-direnci` | — |
| hamilelikte beslenme | `/beslenme/hamilelik` | — |
| kalori hesaplama, BMR, TDEE, kalori açığı | `/kalori-hesaplama` | `/calorie` (üye, Disallow) |
| paket karşılaştır (Diyet vs Spor vs VIP) | `/membership` | `fiyatları` kelimesi title'da yok |

## 2026-08-31 öncelik kuyruğu

| Sorgu | Imp | Pos | Aksiyon |
|-------|-----|-----|---------|
| online diyetisyen fiyatları | 90 | 13.6 | Fiyat title’a 1.299 TL + FAQ birebir |
| diyetisyen fiyatları | 53 | 16.6 | Aynı sayfa; “diyetisyen fiyatları 2026” H2 |
| online diyetisyen | 45 | 81 | Pillar güçlendir; membership/fiyat title’dan head term çıkar; fiyat blog’u çalmasın |
| kas onarımı | 27 | 12.7 | Blog title/H1 = sorgu; iç link pillar’a |
| online diyet | 24 | 77 | Pillar; fiyat/membership çalmasın |
| diyetisyen paket fiyatları | 8 | 12.3 | Fiyat FAQ birebir |
| online coaching ne demek | 7 | 8.7 | `/online-kocluk` FAQ **birebir** |
| online fitness koçu | 5 | 19 | Koçluk title |
| online diyetisyen platformu | 1 | 17 | Pillar FAQ |
| pcos diyeti / polikistik over diyeti | 1+1 | ~30 | Küme iç link + GSC Inspection |

## Sayfa gerçeği

| URL | Imp | CTR | Pos | Not |
|-----|-----|-----|-----|-----|
| `/` | 281 | 60% | 3.1 | Marka. Küme linki şart (`/kilo-verme` Pages’te yok) |
| `/online-diyetisyen/fiyat` | 404 | 1.0% | 26.7 | En büyük fırsat |
| `/membership` | 120 | 0.8% | 23.9 | Fiyat sorgusunu çalıyor |
| `/online-kocluk` | 60 | 3.3% | 14.9 | Quick win |
| `/online-diyetisyen` | 13 | 0% | 1.0 | Head term’de görünmüyor |
| `/kilo-verme` | — | — | — | İndekste yok / 0 gösterim |
| `/blog/{uuid}` | birkaç | 0 | — | Slug’a yönlendir |
| `/index.asp` | 2 | — | 2 | 301 → `/` |
| `https://yeniform.com/` (apex) | 7 | — | 5.4 | www kanonik |

Yasal sayfalar pos ~1.3 — marka/legal arama; noindex yok.

Deploy sonrası GSC URL Inspection: `/`, `/online-diyetisyen`, `/online-diyetisyen/fiyat`, `/online-kocluk`, `/kilo-verme`, `/beslenme/hamilelik`, `/kalori-hesaplama`.

## Yasak (bu mülkte)

- `/membership` title içinde `online diyetisyen fiyat`
- Pillar keywords içinde `online diyetisyen fiyat`
- Şehir doorway
- Hamilelik sayfasında kalori açığı / kilo verdirme iddiası
