# F08 — Calorie Text & Vision

**Text:** If `hasManualCalorieAccess` → chat UI → `POST /api/ai-food-text` → show macros. Else paywall → membership.  

**Vision:** If `hasPhotoCalorieAccess` → camera/gallery → `POST /api/ai-food-vision` (multipart/base64). Else upgrade CTA.  

Quota/rate errors → Turkish message. free/doktor blocked for manual per gate helpers.
