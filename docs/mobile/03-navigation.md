# 03 — Navigation

## Rol gate

| Durum | Hedef |
|-------|--------|
| Unauthenticated → protected | Login; `from` = intended path |
| Admin hit member/staff route | `/admin` |
| Staff hit member/admin | `/staff` |
| Member hit staff/admin | `/profile` or member home |
| Member auth but no `members` row | Onboarding `?plan=` (+ `oauth=1`) |

## Expo Router önerisi

```
app/
  index.tsx                 → redirect by role
  (public)/
    landing.tsx
    membership.tsx
    blog/...
    team/...
    legal/[slug].tsx
    corporate...
  (auth)/
    login.tsx
    forgot-password.tsx
    reset-password.tsx
    onboarding.tsx
    auth/callback.tsx
  (member)/
    _layout.tsx             → tabs + more stack
    dashboard.tsx
    calendar.tsx
    programs.tsx
    messages/...
    schedule.tsx
    health-test/...
    calorie.tsx
    library.tsx
    notifications.tsx
    support.tsx
    profile/...
    call/[sessionType]/[sessionId].tsx
  (staff)/
    _layout.tsx
    index.tsx
    clients/...
    messages/...
    programs.tsx | lists.tsx
    library.tsx
    payments.tsx
    profile.tsx
    call/...
  (admin)/
    _layout.tsx
    ...
```

## Member tabs (öneri)

| Tab | Routes |
|-----|--------|
| Panel | dashboard |
| Program | programs + calendar (stack) |
| Mesajlar | messages |
| Randevu | schedule |
| Daha fazla | health-test, calorie, library, notifications, support, profile, payments, membership |

Badge kaynakları: chatUnread, notificationUnread, openSupportTickets, healthTestIncomplete.

`membership === 'free'` → “Planları İncele” entry.

## Staff drawer/stack

Base: Genel Bakış, Profilim, Danışanlar, Mesajlar, Admin Mesajları, Ödeme.  
+ Collab (coach/dietitian).  
Dietitian: Lists. Coach: Programs + Library.

## Admin

Drawer list → detail screens/sheets. Desktop-heavy (analytics charts, bulk tables) still implemented as simplified mobile views.

## Deep links

| Pattern | Screen |
|---------|--------|
| `yeniform://auth/callback` | Auth callback |
| `yeniform://reset-password` | Reset |
| `yeniform://call/:type/:id` | VideoCall |
| `yeniform://messages/:role` | Member chat |
| `yeniform://staff/messages/:memberId` | Staff chat |

## Web rota eşlemesi

Tam liste: [appendices/A-screen-inventory.md](appendices/A-screen-inventory.md).
