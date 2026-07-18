# Member — Video Call (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/call/[sessionType]/[sessionId]`
- **Staff:** `/(staff)/call/[sessionType]/[sessionId]`
- **Web:** `VideoCallPage.jsx` + `config/videoCall.js` + `hooks/useDailyCall`
- **Priority:** P1
- **Contract:** `contracts/api-daily-room.md`

---

## Path params

- `sessionType`: `coach` | `dietitian` | `doctor` (SESSION_TYPE_META keys)
- `sessionId`: session identifier (sanitized for room)

## Room name (birebir)

```js
roomPrefix = EXPO_PUBLIC_DAILY_ROOM_PREFIX || 'donusum'  // web VITE_DAILY_ROOM_PREFIX
safeId = sessionId.replace(/[^a-zA-Z0-9-_]/g, '')
roomName = `${roomPrefix}-${sessionType}-${safeId}`.toLowerCase()
```

## Token request

```http
POST /api/daily-room
Authorization: Bearer …
Content-Type: application/json

{
  "roomName": "donusum-coach-abc123",
  "userName": "<displayName>",
  "isOwner": false
}
```

- Member: `isOwner: false`
- Staff audience: `isOwner: true` (web: `audience === 'staff'`)

### Success

```json
{ "ok": true, "token": "<jwt>", "roomUrl": "https://{domain}/{roomName}" }
```

`roomUrl` null if domain env missing — still may have token.

### Errors

| Status | error |
|--------|-------|
| 405 | POST bekleniyor |
| 401 | auth error |
| 503 | DAILY_API_KEY tanımlı değil (opsiyonel) |
| 400 | roomName gerekli |
| 500 | message string |

## Join window

Only allow join within `[sessionStart - 15min, sessionEnd + 30min]` defaults unless env overrides — mirror VideoCallPage / VideoJoinLink.

## Native

- Daily React Native SDK
- Camera + microphone permissions
- No custom SFU

## SESSION_TYPE_META labels

- coach: Koç Görüşmesi  
- dietitian: Diyetisyen Görüşmesi  
- doctor: (read rest from `videoCall.js` — copy labels, don’t invent)

## Acceptance

- [ ] roomName formula exact  
- [ ] isOwner staff vs member  
- [ ] API body field names exact (`roomName`, `userName`, `isOwner`)  
- [ ] Prefix default `donusum`  
