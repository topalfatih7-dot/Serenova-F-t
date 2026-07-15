# AI Kurulum Rehberi

Bu proje iki AI sağlayıcısı kullanır:

| Özellik | Sağlayıcı | Model |
|---------|-----------|--------|
| **Kalori (metin + fotoğraf)** | OpenAI | **gpt-4o** |
| Blog / günün ipucu | Google Gemini | `gemini-2.5-flash-lite` (varsayılan) |

API anahtarları **yalnızca sunucuda** (Vercel / `.env.local`) tutulur; tarayıcıya sızmaz.

---

## 1) OpenAI — Kalori hesabı (zorunlu)

### Anahtar al
1. https://platform.openai.com/api-keys adresine git.
2. **Create new secret key** → `sk-...` anahtarını kopyala.
3. Hesapta faturalama / kredi tanımlı olmalı (GPT-4o ücretlidir).

### Yerel (`.env.local`)
```
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o
VITE_AI_VISION_ENABLED=true
VITE_AI_CHAT_ENABLED=true
```
`OPENAI_API_KEY=` satırına `sk-...` değerini yapıştır.

### Vercel
Dashboard → Proje → **Settings → Environment Variables**:

| Değişken | Değer | Ortam |
|----------|-------|-------|
| `OPENAI_API_KEY` | `sk-...` | Production + Preview (+ Development) |
| `OPENAI_MODEL` | `gpt-4o` | Production + Preview (+ Development) |
| `VITE_AI_VISION_ENABLED` | `true` | Production + Preview |
| `VITE_AI_CHAT_ENABLED` | `true` | Production + Preview |

> `OPENAI_API_KEY` **asla** `VITE_` ön eki almaz.

Env ekledikten sonra **Deployments → Redeploy**.

---

## 2) Gemini — Blog / ipucu (opsiyonel, ayrı)

| Değişken | Değer |
|----------|-------|
| `GEMINI_API_KEY` | `AIzaSy...` |
| `GEMINI_MODEL` | `gemini-2.5-flash-lite` *(opsiyonel)* |

Kalori artık Gemini kullanmaz; yalnızca blog cron ve benzeri Gemini uçları bu anahtarı kullanır.

---

## 3) YZ Gider takibi

Her başarılı (ve hatalı) kalori API çağrısı `ai_usage_logs` tablosuna yazılır:

- provider, model, endpoint (`food-text` / `food-vision`)
- prompt / completion / total token
- tahmini `cost_usd` (GPT-4o: $2.50 / $10.00 per 1M giriş/çıkış)

Admin paneli: **YZ Gider** → `/admin/ai-costs`

Migration: `supabase/migrations/20260715_ai_usage_logs.sql`  
Uygulama: `npm run db:migrate`

---

## 4) Yerel test

```bash
# API route'lar için
npm run dev
# veya
vercel dev
```

Kalori ekranından metin veya fotoğraf analizi dene. Admin → YZ Gider’de kayıt görünmeli.

```bash
node scripts/test-ai.mjs --text-only
```

---

## Dosya haritası

| Dosya | Sorumluluk |
|-------|------------|
| `api/_openai.js` | GPT-4o çağrısı + maliyet logu |
| `api/ai-food-text.js` | Metin → kalori |
| `api/ai-food-vision.js` | Fotoğraf → kalori |
| `api/_gemini.js` | Blog / ipucu (Gemini) |
| `api/_aiUsageReport.js` | Admin rapor API |
| `src/pages/admin/AdminAiCostsPage.jsx` | YZ Gider paneli |
| `src/services/calorieChat.js` | Frontend metin kalori |
| `src/services/aiVision.js` | Frontend fotoğraf kalori |
