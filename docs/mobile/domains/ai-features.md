# Domain — AI Features

## Calorie text

- Endpoint: `POST /api/ai-food-text`
- Auth Bearer required
- Gate: `hasManualCalorieAccess`
- Body: natural language food description
- Response: estimated calories/macros (+ cached foods if any)

## Calorie vision

- Endpoint: `POST /api/ai-food-vision`
- Gate: `hasPhotoCalorieAccess`
- Body: image upload
- Native: camera/gallery permissions

## Daily tip

- `GET/POST api/ai-blog-generate?task=daily-tip` (cron + member fetch)
- Cached in `site_content`
- Fallback: `dailyTipFallback.js`

## Blog generation

Admin/cron only — not member mobile critical path.

## Quotas

Respect `_aiQuota.js` / usage logs; show friendly rate-limit errors in Turkish.
