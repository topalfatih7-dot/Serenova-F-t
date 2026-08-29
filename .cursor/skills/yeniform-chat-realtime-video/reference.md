# Chat / Realtime / Video — Reference

## Key files

- `src/hooks/useRealtimeSync.js`
- `src/services/chatDb.js`, `adminChatDb.js`, `staffCollabChatDb.js`
- `src/pages/MessagesPage.jsx`, `staff/*Messages*`, `admin/AdminMessagesPage.jsx`
- `src/pages/VideoCallPage.jsx`, `src/hooks/useDailyCall.js`
- `api/daily-room.js` — oda token + Daily webhook
- `api/_daily.js`, `api/_sessionAttendance.js`, `src/services/sessionAttendance.js`
- Migrations: `20260627_member_staff_chat.sql`, collab/admin chat migrations, `20260714_chat_threads_doctor_role.sql`

## Message shape (typical)

`chat_messages.data` JSONB holds text/body fields used by UI — document exact keys from `chatDb.js` row mappers when writing contracts.
