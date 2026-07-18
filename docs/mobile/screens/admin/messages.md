# Admin — Messages (IMPLEMENTATION LOCK)

- Modes: staff threads, audit (read-only + PDF if web), collab
- Routes: /admin/messages/staff/:id, audit/:threadId, collab/:threadId
- Do not allow admin to impersonate improperly — parity web RLS
