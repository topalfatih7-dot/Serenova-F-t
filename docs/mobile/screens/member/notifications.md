# Member — Notifications (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/notifications`
- **Web:** `/notifications` → `NotificationsPage.jsx`
- **Priority:** P1
- **Domain:** `domains/notifications-model.md`

---

## Header

- title: **Bildirimler**
- subtitle: unread > 0 → `{n} okunmamış mesajınız var` else **Her şey güncel görünüyor**
- Action if unread: **Tümünü okundu işaretle** → `markAllNotificationsRead` + toast **Tümü okundu olarak işaretlendi**

## Filters (yalnızca)

| id | label |
|----|-------|
| unread | Okunmamışlar |
| all | Tümü |
| read | Okunanlar |

Default filter web: `all`.

## Empty

- title: **Bildirim yok**
- description: **Yeni bildirimler burada görünecek.**

## Open / navigate map (birebir)

| condition | navigate |
|-----------|----------|
| `type === 'chat' && staffRole` | `/messages/{staffRole}` |
| `type === 'program'` | `/programs` |
| `type === 'availability' \|\| action === 'availability'` | `/calendar?avail=1` |
| `type === 'support-reply' \|\| type === 'support'` | `/support` |

Always `markNotificationRead(n.id)` first.

## Lifecycle

Unmount: `flushNotificationReads()`.

## Mobile DIFF

- Expo Push tap uses same navigate map
- In-app list still required

## Acceptance

- [ ] Filter labels exact  
- [ ] Navigate map exact  
- [ ] Subtitle / empty / mark-all strings exact  
