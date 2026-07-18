# Member — Calorie (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/calorie`
- **Web:** `/calorie` → `CalorieCalculatorPage.jsx` + `src/services/calorieChat.js`
- **Priority:** P1
- **Domain:** `domains/ai-features.md` + membership gates

---

## Gates (önce kontrol — UI’dan önce)

```
hasManualCalorieAccess(membership)  // text
hasPhotoCalorieAccess(membership)   // vision
```

- Manual false → paywall / membership CTA; **API çağırma**
- Photo false → foto butonu kilitli veya upgrade
- Also: `isCalorieAiEnabled()` — env `VITE_AI_CHAT_ENABLED` / `VITE_AI_VISION_ENABLED` both `false` → feature off

## Text API

```http
POST {API_BASE}/api/ai-food-text
Authorization: Bearer <access_token>
Content-Type: application/json

{ "text": "<user text trim>" }
```

### Validation (server)

| Condition | Response |
|-----------|----------|
| !auth | 401 `{ ok:false, error }` |
| rate limit | 429 |
| daily quota | quota.status + error |
| text length < 2 | 400 `{ ok:false, error: "Metin gerekli" }` |
| text length > 2000 | 400 `{ ok:false, error: "Metin çok uzun (max 2000 karakter)" }` |

### Success (client expects)

```json
{
  "ok": true,
  "label": "string",
  "items": [
    { "name": "string", "amount": 1, "unit": "porsiyon", "cal": 100 }
  ],
  "confidence": "low|medium|high|...",
  "cached": false,
  "source": "openai|cache|dictionary|..."
}
```

Client wrapper `analyzeFoodText` maps errors via `formatAiError`.

### Reply formatting (`formatAnalysisReply`) — birebir mantık

- No items:  
  `Yiyecek tespit edilemedi. Lütfen ne yediğinizi daha açık yazın.\nÖrnek: 2 yumurta, 1 dilim tam buğday ekmeği, 1 kase yoğurt`
- Else lines:
  - `🍽 {label}`
  - `• {name} — {amount} {unit} · ~{cal} kcal`
  - `📊 Toplam: ~{total} kcal`
  - if confidence low: `⚠️ Düşük güven — tahmini değerlerdir.`
  - if cache/dictionary: kayıtlı öğün/sözlük tip mesajları (calorieChat.js)

Emoji’leri kaldırma (web parity).

## Vision API

`POST /api/ai-food-vision` + Bearer + image body **web client ile aynı encoding**. Gate: photo access. Native: camera/gallery permission.

## Layout

Chat-first: message list + composer; photo button if gated allowed.  
Package lock screen if !manual access.

## Acceptance

- [ ] Gates before fetch  
- [ ] Request/response fields above  
- [ ] formatAnalysisReply parity  
- [ ] Max 2000 chars client-side optional but server enforced  
- [ ] No alternate AI provider in app  
