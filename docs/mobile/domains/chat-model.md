# Domain — Chat Model (LOCK)

## Systems (yalnızca bunlar)

1. Member ↔ staff: `chat_threads` / `chat_messages`
2. Admin ↔ staff: `admin_staff_*`
3. Collab: `staff_collab_*`

## Member-staff thread uniqueness

`(member_id, staff_role)` unique. `staff_role`: coach | dietitian | doctor.

## Client mappers (zorunlu alanlar)

### Thread

From `rowToChatThread`:

- id, memberId, staffId, staffRole, lastMessageAt
- memberName, staffName, lastPreview ← `data.*`
- memberUnread, staffUnread ← Number
- memberConsentAt
- createdAt, data

### Message

- id, threadId, senderType, senderId
- text ← `data.text`
- createdAt

## sendChatMessage algorithm

1. trim → empty ⇒ `{ success:false, error:'Mesaj boş.' }`
2. contactInfoGuard → blocked ⇒  
   `Güvenliğiniz için mesajınızda paylaşım algılandı. Tüm iletişim uygulama içinden yürütülmelidir; lütfen iletişim bilgisi paylaşmadan tekrar yazın.`
3. insert `{ thread_id, sender_type, sender_id, data:{ text } }`
4. preview ≤120 + `…`
5. unread++ on opposite side
6. update `last_message_at` + data
7. if staff sender → `notifyMemberChatMessage`

## getOrCreateChatThread

Insert data seed:

```json
{
  "memberName": "<member.name || 'Üye'>",
  "staffName": "<contact.name || ''>",
  "memberUnread": 0,
  "staffUnread": 0
}
```

## Consent

`recordChatConsent` sets `data.memberConsentAt` ISO now.

## mark read

member → `memberUnread=0`; staff → `staffUnread=0`.

## Hydrate

`hydrateChatThreads(session, member, staffList, staffUser, members)` — admin all; member ensure contacts; staff ensure clients.

Do not invent websocket protocol outside Supabase realtime.
