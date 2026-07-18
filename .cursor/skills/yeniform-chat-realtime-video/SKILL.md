---
name: yeniform-chat-realtime-video
description: >-
  Handles Yeni Form chat systems, Supabase realtime, Daily.co video calls, and
  push notifications. Use when working on mesajlar, chat, realtime, Daily,
  video görüşme, unread badge, collab messages, admin staff chat, or push.
---

# Yeni Form Chat, Realtime & Video

## Three chat systems

1. **Member ↔ staff:** `chat_threads` / `chat_messages` — unique `(member_id, staff_role)`; roles coach|dietitian|doctor
2. **Admin ↔ staff:** `admin_staff_*`
3. **Coach ↔ dietitian collab:** `staff_collab_*` (member context)

RLS: member own threads; `staff_manages_member`; admin. Realtime via `useRealtimeSync` channels.

## Daily video

- Route: `/call/:sessionType/:sessionId` (member) or `/staff/call/...`
- API: `POST /api/daily-room` — auth required; private room; token ~1h; room exp ~2h; max 4
- Mobile: Daily React Native SDK; camera/mic permissions

## Push (mobile addition)

Web uses in-app + browser notifications. Mobile must add Expo Push for chat/session/support; store tokens server-side (design in `docs/mobile/domains/realtime.md`).

## Checklist

- [ ] Unread badges parity (memberNav / staffNav)
- [ ] Presence only where web has it (admin active users)
- [ ] Specs: `domains/chat-model.md`, `10`/flows F06–F07

## Related

[reference.md](reference.md)
