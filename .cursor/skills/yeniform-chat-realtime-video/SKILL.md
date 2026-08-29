---
name: yeniform-chat-realtime-video
description: >-
  Handles Yeni Form chat systems, Supabase realtime, Daily.co video calls, and
  in-app / browser / WhatsApp notifications. Use when working on mesajlar, chat,
  realtime, Daily, video görüşme, unread badge, collab messages, admin staff chat,
  or push (browser).
---

# Yeni Form Chat, Realtime & Video

## Three chat systems

1. **Member ↔ staff:** `chat_threads` / `chat_messages` — unique `(member_id, staff_role)`; roles coach|dietitian|doctor
2. **Admin ↔ staff:** `admin_staff_*`
3. **Coach ↔ dietitian collab:** `staff_collab_*` (member context)

RLS: member own threads; `staff_manages_member`; admin. Realtime via `useRealtimeSync` channels.

## Daily video

- Route: `/call/:sessionType/:sessionId` (member) or `/staff/call/...`
- API: `POST /api/daily-room` `{ sessionType, sessionId, userName }` — üye/atanmış staff/admin; join penceresi sektör bazlı; `is_owner` yalnız staff/admin; token `user_id` = `member|staff|admin:{id}`; oda `exp` = join penceresi sonu
- Daily webhook (aynı route, `X-Webhook-Signature`): `participant.joined` / `participant.left` / `meeting.ended` → attendance segmentleri + hakediş finalize
- İstemci yedek: `session-attendance` join/leave (`pagehide` keepalive). Overlap = kapalı segment kesişimi, randevu penceresine kırpılır, `duration` tavanı; `now` fallback yok

## Notifications (web)

- In-app: `members.data.notifications` via `append_member_notification`
- Browser: `pushNotifs` + Notification API (`browserNotifications.js`)
- WhatsApp: `/api/application-notify` (`whatsapp-event` + member outbound fan-out)

## Checklist

- [ ] Unread badges parity (memberNav / staffNav)
- [ ] Presence only where web has it (admin active users)

## Related

[reference.md](reference.md)
