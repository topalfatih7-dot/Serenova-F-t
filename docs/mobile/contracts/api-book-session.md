# Contract — book-session (LOCK)

Via `POST /api/auth`.

## Request

```json
{
  "action": "book-session",
  "type": "coach",
  "startsAt": "2026-07-20T07:00:00.000Z",
  "duration": 30
}
```

`type`: `coach` | `dietitian` | `doctor`  
Client pre-check no token → **Oturum gerekli.**

## Success session object (server creates)

```json
{
  "ok": true,
  "session": {
    "id": "bk-…",
    "type": "coach",
    "title": "Koç Görüşmesi",
    "date": "<ISO>",
    "duration": 30,
    "status": "scheduled",
    "coach": "<staff name>",
    "bookedBy": "member",
    "createdAt": "<ISO>"
  }
}
```

Titles: Koç Görüşmesi | Diyetisyen Görüşmesi | Doktor Görüşmesi  
Stored under `members.data.coachSessions|dietitianSessions|doctorSessions`.

## Errors (exact)

| error |
|-------|
| Geçersiz randevu türü. |
| Geçmiş bir zaman seçilemez. |
| Üye kaydı bulunamadı. |
| Bu randevu türü için atanmış bir uzman yok. |
| Uzman bulunamadı. |
| Seçilen saat uzmanın müsaitliği dışında. |
| Bu saat dolu, lütfen başka bir slot seçin. |
| Doktor görüşme hakkınız kullanıldı ({used}/{limit}). |
| Bu ay için randevu hakkınız doldu ({used}/{limit}). |

Availability check: Istanbul dow + hour key `HH:00` must be in staff.data.availability.

## UI companion

Full booker UX: `screens/member/session-booker.md`
