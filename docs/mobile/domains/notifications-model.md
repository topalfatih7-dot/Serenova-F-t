# Domain — Notifications (LOCK)

## Storage

`members.data.notifications[]` — each item typically:

```ts
{
  id: string
  type: string   // 'chat' | 'program' | 'availability' | 'support-reply' | 'support' | ...
  title: string
  message?: string
  read: boolean
  createdAt?: string
  staffRole?: 'coach' | 'dietitian' | 'doctor'  // for chat
  action?: string  // e.g. 'availability'
  ticketId?: string
}
```

Builders: `src/data/memberNotificationTemplates.js` + `buildMemberNotification` — **port templates; do not invent new types without updating navigate map**.

## Client APIs

- `markNotificationRead(id)` — optimistic + debounced persist
- `markAllNotificationsRead()`
- `flushNotificationReads()` on notifications screen unmount

## Navigate map

See `screens/member/notifications.md`.

## Push (mobile)

Store Expo push tokens; on insert of notification or chat, server/worker sends push with `data: { type, staffRole, ... }` matching navigate map.
