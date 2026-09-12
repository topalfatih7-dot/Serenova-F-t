# Günlük SEO ajanı

Yeni sayfa basma. Her gün canlı siteyi incele, **tek** kurala uygun iş seç, PR aç. Merge insan.

Site: `https://www.yeniform.com`. GSC API yok — son playbook + varsa `docs/seo/*.xlsx|*.csv` + probe.

## Koşu sırası

1. Bu dosya, [gsc-playbook.md](gsc-playbook.md) silosu, [DAILY_LOG.md](../../../docs/seo/DAILY_LOG.md) son 14 gün, varsa yeni GSC export.
2. `npm run seo:probe` (veya `node scripts/seo-daily-probe.mjs`).
3. Öncelik: teknik kırık → GSC kuyruğu snippet/CTR → mevcut sayfada iç link.
4. **Tek iş, tek URL, tek sınıf** (title/desc **veya** görünür FAQ **veya** iç link **veya** teknik).
5. Değişiklik varsa `seo/daily-YYYY-MM-DD` dalı + PR. Yoksa koşu özeti; boş PR yok.

## Öncelik

1. Sitemap 500, robots hatası, soft 404, canonical çatışması, ham HTML’de title/H1/canonical yok, prerender H1 niyet kayması.
2. Playbook kuyruğu: gösterim yüksek, CTR zayıf veya pos 8–20 — **sahip URL** üzerinde snippet.
3. Yanlış URL tıklanıyorsa sahip sayfayı güçlendir; diğerinde head term’i title’dan çıkar (cannibalization kanıtı şart).
4. Mevcut küme/pillar’a crawlable `<a href>` iç link. Header’a hizmet linki koyma.

## İzinli

Mevcut indexli sayfada title, meta description, görünür FAQ, silo iç linki, prerender/H1 kayması, sitemap `lastmod` dürüstlüğü, indeks tıkanıklığı (Inspection notu PR’da).

## Yasak

- Yeni public rota, küme, blog “bugün içerik üretelim”, şehir doorway
- Sahte `AggregateRating` / uydurma review
- `/membership` title içinde `fiyatları` veya `online diyetisyen fiyat`
- Pillar keywords içinde fiyat head term
- Keyword stuffing; canonical/robots toplu değişim
- Header/Keşfet menüsüne `/online-diyetisyen` veya `/online-kocluk` geri koyma (footer + anasayfa yeter)
- WhatsApp ürün kodu; `displayPlatformStats` kilitleri
- `main`’e push, merge, `--no-verify`

Hamilelik sayfasında kalori açığı / kilo verdirme iddiası yok. YMYL’de teşhis/tedavi yok.

## Silo (kısa)

| Sorgu | Sahip | Çalmasın |
|-------|-------|----------|
| online diyetisyen / online diyet | `/online-diyetisyen` | membership, fiyat H1, kadro title |
| diyetisyen fiyatları / ücret | `/online-diyetisyen/fiyat` | `/membership` title |
| online koçluk / coaching / fitness koçu | `/online-kocluk` | membership H1 |
| evde antrenman | `/online-kocluk/ev-antrenman` | — |
| kilo verme / online zayıflama | `/kilo-verme` | homepage H1 |
| paket karşılaştır | `/membership` | title’da `fiyatları` yok |

## PR gövdesi

- URL + değişiklik sınıfı + hipotez
- Probe kanıtı (status/title/H1/canonical)
- 14 gün sonra GSC’de bakılacak sorgu/metrik
- `docs/seo/DAILY_LOG.md` aynı PR’da bir satır

## Cursor Automation (21:00 TR)

Teknik tarama ayrıca GitHub Actions `SEO daily probe` ile her gün 21:00 TR çalışır (`0 18 * * *`). Sitemap/title kırığı orada kırmızı olur; içerik PR’si yine bu ajan.

Tetik: her gün 21:00 Türkiye = cron `0 18 * * *` (UTC+3). Dal: `main`. Araçlar: git (PR aç). `main`’e push/merge yok.

Ajan prompt’u (editöre yapıştır):

Yeni Form günlük SEO. Playbook: `.cursor/skills/yeniform-seo/daily-ops.md` ve `gsc-playbook.md`. Log: `docs/seo/DAILY_LOG.md`. Önce `npm run seo:probe` çalıştır (canlı www, Googlebot UA). Yeni public sayfa/küme/blog üretme. Header Keşfet menüsüne `/online-diyetisyen` veya `/online-kocluk` koyma. WhatsApp ve display stats kilitlerine dokunma. Teknik kırık yoksa GSC kuyruğundan mevcut bir URL’de tek sınıf değişiklik yap (title veya görünür FAQ veya iç link). `/membership` title’da `fiyatları` yok. Sahte rating yok. Değişiklik varsa `seo/daily-YYYY-MM-DD` dalı + PR; log’a bir satır. Yoksa PR açma.
