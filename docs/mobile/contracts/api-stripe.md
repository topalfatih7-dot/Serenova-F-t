# Contract — Stripe

## POST /api/stripe-checkout

Headers: Bearer  
Body:

```json
{ "planId": "vip", "flow": "register", "durationMonths": 3, "email": "optional@x.com" }
```

Success:

```json
{ "url": "https://checkout.stripe.com/..." }
```

Mobile: prefer IAP; if ever used, open URL in browser / SFSafariView and rely on webhook + deep link return.

## POST /api/stripe-webhook

Stripe signature header; server updates members/payments. Not called from app.
