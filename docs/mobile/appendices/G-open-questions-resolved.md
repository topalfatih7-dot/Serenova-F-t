# Appendix G — Decisions & Status

## Resolved decisions

| Topic | Decision |
|-------|----------|
| Scope | Member + Staff + Admin |
| Framework | Expo |
| Payments | IAP/RevenueCat mobile + Stripe web |
| Spec location | `docs/mobile/` |
| Skills | `.cursor/skills/yeniform-*` auto-invoke |
| Landing | Native summary + CTA; full marketing optional WebView |
| Legal | Bundle or WebView — wording must not be altered |
| Public team | No email/phone/social |

## IMPLEMENTATION LOCK — complete

All planned screens and contracts marked LOCK or explicit WebView policy. See `COMPLETE.md`.

Remaining only as **code phase** (not docs): Expo app, store products, RevenueCat webhook implementation, push worker.

## Gap protocol

Still active during coding: if runtime API differs from contract, stop and update contract — do not invent.
