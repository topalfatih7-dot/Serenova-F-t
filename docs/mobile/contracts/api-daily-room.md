# Contract — POST /api/daily-room (LOCK)

## Request

```http
POST /api/daily-room
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "roomName": "donusum-coach-sessionid",
  "userName": "Ayşe",
  "isOwner": false
}
```

Required: `roomName`.  
`userName` default server-side: `Katılımcı`.

## Success 200

```json
{
  "ok": true,
  "token": "<daily meeting token>",
  "roomUrl": "https://YOURDOMAIN.daily.co/donusum-coach-sessionid"
}
```

`roomUrl` may be `null` if `VITE_DAILY_DOMAIN` / domain env empty.

## Errors

```json
{ "ok": false, "error": "POST bekleniyor" }
```

```json
{ "ok": false, "error": "roomName gerekli" }
```

```json
{ "ok": false, "error": "DAILY_API_KEY tanımlı değil (opsiyonel)" }
```

## Server room properties (do not change in mobile)

- privacy: private  
- exp: now+7200s  
- max_participants: 4  
- enable_screenshare/chat: true  
- token exp: now+3600s  

## Client helper

Web: `getDailyToken(roomName, userName, isOwner)` returns token string or null (swallows errors). Mobile may surface 503 to user.
