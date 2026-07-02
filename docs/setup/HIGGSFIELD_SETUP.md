# Higgsfield — AI Görsel/Video (Cursor MCP)

> **Durum:** 🧪 Deneme / opsiyonel — production'a bağlı değil.  
> Hareket kütüphanesi videoları için AI üretim denemesi.  
> **Kaldırmak için:** `.cursor/mcp.json` içinden `higgsfield` bloğunu sil + bu dosyayı sil.

HeyGen yerine **Higgsfield MCP** kullanılır. Resmi URL: https://higgsfield.ai/mcp

---

## Bağlantı

`.cursor/mcp.json`:

```json
"higgsfield": {
  "url": "https://mcp.higgsfield.ai/mcp"
}
```

1. Cursor'ı yeniden başlat
2. **Settings → MCP** → `higgsfield` → **Connect**
3. İlk üretim isteğinde tarayıcıda Higgsfield OAuth ile giriş yap
4. API key gerekmez

---

## Ne yapar

| Yapar | Yapmaz |
|-------|--------|
| 30+ model (Kling, Seedance, Veo, Soul vb.) ile görsel/video | Uygulama koduna otomatik entegre olmaz |
| OAuth ile hesaba bağlanır | `exercises` tablosuna otomatik kayıt atmaz |
| Soul character ile tutarlı avatar | Daily.co video görüşme değildir |

Video sonrası: MP4 indir → **Admin → Kütüphane** → `uploadExerciseVideo`.

---

## Hareket videosu brief (örnek)

- Konuşma / intro yok — doğrudan hareket
- Köşe overlay metinleri (Türkçe)
- Logolu siyah Yeni Form tişörtü (Soul character veya referans foto)

---

## HeyGen kaldırma

HeyGen OAuth: [app.heygen.com](https://app.heygen.com) → Settings → Connected apps → Disconnect

---

## OAuth kesme

Higgsfield hesabından MCP/Cursor bağlantısını platform ayarlarından kaldırın.

Resmi dokümantasyon: https://higgsfield.ai/mcp
