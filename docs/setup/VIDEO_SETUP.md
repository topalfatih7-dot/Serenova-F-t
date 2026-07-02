# Video Görüşme Kurulum Rehberi (Daily.co)

Uygulamadaki koç/diyetisyen görüşmeleri **Daily.co** SDK üzerinde çalışır.
UI tamamen hazır; sadece aşağıdaki adımları uygulamanız gerekiyor.

---

## Altyapı Durumu

| Bileşen | Durum | Dosya |
|---------|:-----:|-------|
| Video katılımcı karoları | ✅ Hazır | `src/components/video/VideoCallUI.jsx` |
| Mikrofon / kamera / ekran paylaşımı kontrolleri | ✅ Hazır | |
| Cihaz seçici (kamera/mikrofon) | ✅ Hazır | |
| Görüşme öncesi önizleme | ✅ Hazır | |
| Randevu zaman penceresi kontrolü | ✅ Hazır | `src/services/videoCallSession.js` |
| Üye & personel sayfaları | ✅ Hazır | `src/pages/VideoCallPage.jsx` |
| Server-side oda oluşturma + token | ✅ Hazır | `api/daily-room.js` |
| Katılım linki (randevu kartından) | ✅ Hazır | `src/components/video/VideoJoinLink.jsx` |

---

## Adım 1 — Daily.co Hesabı Oluştur

1. https://dashboard.daily.co adresine git → **Sign up** (ücretsiz plan mevcut).
2. Hesap oluştururken bir **subdomain** seçersin (örn. `klinikadi`).
   - Tam domain adresin: `klinikadi.daily.co`
   - **Bu adresi not al**, sonraki adımda kullanacaksın.

---

## Adım 2 — Temel Çalıştırma (Ücretsiz, 5 dakika)

Vercel → **Settings → Environment Variables** paneline gir:

| Değişken | Değer | Açıklama |
|----------|-------|----------|
| `VITE_DAILY_DOMAIN` | `yeniform.daily.co` | Daily subdomain'in |
| `VITE_DAILY_ROOM_PREFIX` | `donusum` | Oda adı öneki (isteğe bağlı) |

Ardından **Redeploy** yap → Video görüşmeler artık çalışır.

> **Bu kadar!** Ücretsiz planda görüşmeler çalışır; odalar public'tir (URL bilinirse
> herkes girebilir). Küçük klinikler için yeterlidir. Güvenli mod için Adım 3'e bak.

---

## Adım 3 — Production Güvenli Mod (Önerilen)

Özel oda + kısa süreli token → **yalnızca randevusu olan kişi girebilir**.

### 3a. API Anahtarı Al
1. Daily.co Dashboard → **Developers → API Keys → New API Key**.
2. Anahtarı kopyala.

### 3b. Vercel'e Ekle

| Değişken | Değer | Gizli? |
|----------|-------|:------:|
| `DAILY_API_KEY` | Daily API anahtarın | ✅ Evet (VITE_ YOK!) |

> `DAILY_API_KEY` sunucuda kalır, tarayıcıya sızmaz (`api/daily-room.js`
> üzerinden Vercel'de çalışır). Bu anahtar asla `VITE_` ile başlamaz.

### 3c. Redeploy
Değişkenleri ekledikten sonra Vercel'de yeniden dağıtım yap.
Artık her görüşme:
- Private oda oluşturulur (URL yeterli değil).
- Katılımcıya 1 saatlik token verilir.
- Koç/diyetisyen "owner" (oturumu yönetebilir), danışan "guest" olarak girer.

---

## Adım 4 — Randevuları Sisteme Ekle

Video görüşme butonu yalnızca **randevu zamanı ±15/30 dk içinde** aktif olur.
Admin paneli üzerinden:

1. **Admin → Üyeler** → üyeyi seç.
2. Koç veya diyetisyen ata.
3. Randevu ekle (tarih + saat + seans tipi: coach/dietitian).
4. Üye ve personel panelinde "Görüşmeye Katıl" butonu otomatik aktifleşir.

---

## Adım 5 — Test

1. Bir üye ve bir personel hesabıyla giriş yap (farklı tarayıcı/sekme).
2. İkisi de `/call/coach/SESSION_ID` adresine git (veya randevu kartındaki linke tıkla).
3. Kamera/mikrofon izni ver → görüntü başladığında entegrasyon tamamlanmıştır.

---

## Fiyatlandırma

| Plan | Ücretsiz katman | Ücretli |
|------|-----------------|---------|
| Daily.co | 10K dakika/ay ücretsiz | $0.004/dk/katılımcı |

10.000 dakika = ~167 saat görüşme/ay → büyük çoğunluk için ücretsiz yeterlidir.

---

## Sık Sorulan Sorular

**Görüntü açılmıyor, hata var**
- Tarayıcı kamera/mikrofon iznini kontrol et.
- `VITE_DAILY_DOMAIN` değerinde `https://` veya `/` olmamalı (sadece `subdomain.daily.co`).

**"Video SDK Yapılandırması Gerekli" ekranı çıkıyor**
- `VITE_DAILY_DOMAIN` env değişkeni Vercel'e eklenmedi veya Redeploy yapılmadı.

**Randevu kartında link yok**
- Randevunun `status: 'scheduled'` olması gerekir.
- `VITE_DAILY_DOMAIN` tanımlı olmalıdır.

**Token hatası (403/Unauthorized)**
- `DAILY_API_KEY` yanlış veya expired → Daily Dashboard'dan yeni anahtar oluştur.
- Token güvenli modunu devre dışı bırakmak için `DAILY_API_KEY`'i kaldır; public
  oda moduna döner.

---

## Dosya Haritası

```
api/daily-room.js              → Server-side: oda oluştur + token üret
src/config/videoCall.js        → Oda URL'si + getDailyToken()
src/hooks/useDailyCall.js      → Daily.co JS SDK wrapper (token destekli)
src/pages/VideoCallPage.jsx    → Üye ve personel görüşme sayfası
src/components/video/
  VideoCallUI.jsx              → Katılımcı karoları + kontroller + cihaz seçici
  VideoJoinLink.jsx            → Randevu kartı "Katıl" linki
src/services/videoCallSession.js → Zaman penceresi + bağlam çözümleme
```
