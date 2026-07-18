# Member — Messages (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/messages` + `/(member)/messages/[role]`
- **Web:** `/messages`, `/messages/:role` → `MessagesPage.jsx`
- **Priority:** P1
- **Domain:** `domains/chat-model.md`
- **Flow:** F07

---

## Purpose

Atanmış koç / diyetisyen / doktor ile mesajlaşma.

## Preconditions

Registered member. Contacts from `getMemberChatContacts(member, staffList)` — uydurma contact yok.

## Data shapes (zorunlu)

### Thread (client model from `rowToChatThread`)

```ts
{
  id: string
  memberId: string
  staffId: string
  staffRole: 'coach' | 'dietitian' | 'doctor'
  lastMessageAt: string | null
  memberName: string
  staffName: string
  lastPreview: string
  memberUnread: number
  staffUnread: number
  memberConsentAt: string | null
  createdAt: string
  data: object
}
```

### Message

```ts
{
  id: string
  threadId: string
  senderType: 'member' | 'staff' | 'system'
  senderId: string | null
  text: string          // from data.text
  createdAt: string
}
```

### Insert message row

```json
{
  "thread_id": "<uuid>",
  "sender_type": "member",
  "sender_id": "<member uuid>",
  "data": { "text": "<trimmed>" }
}
```

### Thread data keys used

`memberName`, `staffName`, `lastPreview`, `memberUnread`, `staffUnread`, `memberConsentAt`

---

## Layout

1. Role tabs/segments: only roles with contacts (coach/dietitian/doctor)  
2. Thread header: staffName  
3. Consent gate if `!memberConsentAt` → `ChatConsentModal` parity → `recordChatConsent`  
4. Message list chronological  
5. Composer  

Empty: uzman atanmadı — contact list empty.

## Send rules (birebir `sendChatMessage`)

1. trim; empty → error **Mesaj boş.**  
2. `detectExternalContactInfo(text)` — blocked → **CONTACT_INFO_BLOCK_MESSAGE** (web sabitinden kopyala; aşağıya bak)  
3. Insert message  
4. Update thread: `last_message_at`, `lastPreview` (max 120 chars + …), increment `staffUnread` if sender member  
5. Staff→member also triggers `notifyMemberChatMessage`

### CONTACT_INFO_BLOCK_MESSAGE (birebir)

```
Güvenliğiniz için mesajınızda paylaşım algılandı. Tüm iletişim uygulama içinden yürütülmelidir; lütfen iletişim bilgisi paylaşmadan tekrar yazın.
```

Blocked patterns: email regex; phone ≥9 digits; keywords: whatsapp, wa.me, telegram, t.me/, instagram, snapchat, discord, skype, messenger, facebook.com, fb.com/, twitter.com/, x.com/, linkedin.com/in (see `contactInfoGuard.js`).

## Read

Open thread → `markChatThreadRead(threadId, 'member')` → `memberUnread = 0`.

## Realtime

Subscribe chat_messages / chat_threads; filter relevant threads.

## Deep link

`/messages/:role` selects role tab.

## Acceptance

- [ ] Shapes match above  
- [ ] Contact info guard identical  
- [ ] Consent before chat if required by web UI  
- [ ] No third chat system mixed into this screen  
- [ ] Unread badge uses memberUnread sum  
