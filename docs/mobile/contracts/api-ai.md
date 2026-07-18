# Contract — AI (LOCK)

## POST /api/ai-food-text

### Request

```http
POST /api/ai-food-text
Authorization: Bearer <access_token>
Content-Type: application/json

{ "text": "2 yumurta ve 1 dilim ekmek" }
```

### Success

```json
{
  "ok": true,
  "label": "Kahvaltı",
  "items": [
    { "name": "Yumurta", "amount": 2, "unit": "adet", "cal": 140 }
  ],
  "confidence": "medium",
  "cached": false,
  "source": "openai"
}
```

Item fields after normalize: `name` ≤60, `amount` number, `unit` ≤20 default `porsiyon`, `cal` ≥0 int.

### Errors

```json
{ "ok": false, "error": "Metin gerekli" }
```

```json
{ "ok": false, "error": "Metin çok uzun (max 2000 karakter)" }
```

```json
{ "ok": false, "error": "<quota or rate limit message>" }
```

Rate limit: 30 / hour / user (`ai-food-text` prefix). Daily AI quota via `checkAiDailyQuota`.

Client: `src/services/calorieChat.js` — `analyzeFoodText`, `formatAnalysisReply`.

## POST /api/ai-food-vision

Auth Bearer. Body encoding: **copy from web CalorieCalculatorPage / vision client** — do not invent multipart field names. Same item schema as text on success.

## Daily tip

Prefer existing member fetch path used by `useDailyTip` (site_content cache and/or `ai-blog-generate?task=daily-tip`). Fallback string from `dailyTipFallback.js` if network fails — read that file for exact fallbacks.
