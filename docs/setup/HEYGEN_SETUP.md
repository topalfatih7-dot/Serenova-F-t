# HeyGen — Hareket Kütüphanesi Video Üretimi (Cursor MCP)

> **Durum:** 🧪 AI üretim — production'a otomatik bağlı değil.  
> Hareket kütüphanesi (`exercises`) için sessiz demo videoları.  
> **Kaldırmak için:** `.cursor/mcp.json` içinden `heygen` bloğunu sil + bu dosyayı sil.

Resmi MCP URL: https://mcp.heygen.com/mcp/v1/

---

## Bağlantı

`.cursor/mcp.json`:

```json
"heygen": {
  "url": "https://mcp.heygen.com/mcp/v1/"
}
```

1. Cursor'ı yeniden başlat
2. **Settings → MCP** → `heygen` → **Connect**
3. İlk üretim isteğinde tarayıcıda HeyGen OAuth ile giriş yap
4. API key gerekmez (OAuth)

---

## Serenova video standardı (tüm hareketler)

| Kural | Değer |
|-------|--------|
| Süre | **20 saniye** (intro/outro yok) |
| Ses | **Yok** — sessiz MP4 |
| Karakterler | **Sabit 1 kadın + 1 erkek** — her videoda aynı avatar look ID'leri |
| Kıyafet | Siyah tişört, minimal **Yeni Form** logosu (göğüs) |
| Mekân | Aydınlık modern spor stüdyosu, nötr arka plan |
| Bilgilendirme | Hareket **kesilmeden** devam eder; **sağ alt köşede** yarı saydam bilgi kutusu (Türkçe) |
| Format | 16:9, 1080p |
| Konuşma | Yok — lip-sync / anlatım yok |

### Köşe overlay metinleri (örnek: Squat)

Sırayla, hareket akarken:

1. `Ayaklar omuz genişliğinde`
2. `Sırt düz, göğüs açık`
3. `Kalça geriye, dizler ayak uçları hizasında`
4. `Kontrollü iniş ve kalkış`

### HeyGen araç seçimi

| Araç | Ne zaman |
|------|----------|
| `create_video_from_cinematic_avatar` | **Önerilen** — konuşma yok, hareket prompt ile; egzersiz demo |
| `create_video_agent` | Metin/overlay ağırlıklı senaryolar; sessiz mod için prompt'ta sesi kapat |
| `create_prompt_avatar` | İlk kurulum: kadın/erkek karakter oluştur, look ID'leri kaydet |

Karakter tutarlılığı: İlk oturumda iki `create_prompt_avatar` veya stok avatar look seç; `avatar_id` değerlerini aşağıdaki tabloya yaz. Sonraki tüm videolarda **aynı ID'ler**.

### Karakter kayıt defteri

| Rol | Avatar look ID | Not |
|-----|----------------|-----|
| Kadın koç | _(OAuth sonrası doldur)_ | Fit, 25–35, siyah Yeni Form tişört |
| Erkek koç | _(OAuth sonrası doldur)_ | Fit, 25–35, siyah Yeni Form tişört |

---

## İlk video: Squat (Çömelme)

**Kategori:** Alt Vücut / Bacak  
**Prompt özeti (cinematic avatar):**

```text
20-second silent fitness exercise demonstration. No intro, no outro, no speech, no music, no sound.
Bright modern gym studio, neutral background. Landscape 16:9, 1080p.

Two fitness coaches in matching black t-shirts with small "Yeni Form" chest logo:
- Female coach demonstrates bodyweight squat in the center
- Male coach stands slightly behind to the side, mirroring form cues

Continuous full-body movement for entire 20 seconds — no cuts, no talking head segments.
While squatting continues, show Turkish instruction text in a semi-transparent lower-right corner overlay:
"Ayaklar omuz genişliğinde" → "Sırt düz" → "Kalça geriye" → "Kontrollü iniş"
Text changes every ~5 seconds without stopping the exercise motion.
Professional fitness app style, clean lighting, realistic human movement.
```

---

## Üretim sonrası

1. MP4 indir
2. **Admin → Kütüphane** → Yeni Hareket
3. Ad: `Squat`, Kategori: `Bacak`, açıklama + video yükle

HeyGen otomatik `exercises` tablosuna yazmaz.

---

## Kredi / plan

Üretim mevcut HeyGen plan kredilerinden düşer. `get_current_user` ile bakiye kontrol edilebilir.

OAuth kesme: [app.heygen.com](https://app.heygen.com) → Settings → Connected apps → Disconnect

Resmi dokümantasyon: https://developers.heygen.com/mcp/overview
