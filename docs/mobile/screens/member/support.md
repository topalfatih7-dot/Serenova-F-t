# Member — Support (IMPLEMENTATION LOCK)

- **Expo:** `/(member)/support`
- **Web:** `/support` → `SupportPage.jsx` + `SupportForm` + `TicketThread`
- **Priority:** P1
- **Flow:** F09

---

## Header

- title: **Destek Merkezi**
- subtitle: **Talepleriniz anlık olarak destek ekibine iletilir**

## Ticket status labels (birebir)

| status | label |
|--------|-------|
| open | Bekliyor |
| in-progress | İşleme Alındı |
| closed | Çözüldü |

## Quick actions (ids + category strings)

| id | category (form) | title | desc |
|----|-----------------|-------|------|
| technical | Teknik sorun | Teknik Sorun | Uygulama veya platform hatası bildirin |
| payment | Ödeme | Ödeme & Paket | Fatura, ödeme veya paket sorularınız |
| health | Sağlık bildirimi | Sağlık Bildirimi | Sağlık testi veya programla ilgili bildirim |
| general | Genel soru | Genel Soru | Diğer tüm soru ve talepleriniz için |

## SupportForm fields

| field | rules |
|-------|-------|
| category | one of: `Genel soru`, `Teknik sorun`, `Sağlık bildirimi`, `Ödeme` |
| subject | required — error **Konu gerekli** |
| message | required; min 10 — **Mesaj gerekli** / **En az 10 karakter** |

Success panel:
- title: **Talebiniz alındı**
- body: **Destek ekibimiz en kısa sürede size dönüş yapacak.**

Create toast: **Destek talebiniz alındı. Admin panelinde görünecek.**

## createTicket payload → DB

```js
{
  member_id,
  status: 'open',
  data: {
    subject: ticketData.subject || 'Destek Talebi',
    category: ticketData.category || 'Genel',
    memberName: member.name || 'Ziyaretçi',
    messages: [{ id, from: 'member', text: message, createdAt }],
    createdAt
  }
}
```

## Reply

`sendTicketReply(id, 'member', text)`  
- contact info guard same as chat  
- success toast: **Mesajınız gönderildi**  
- fail: API error or **Mesaj gönderilemedi**

## Also on page

FAQ accordion from `faqs` (site_content) — display only.

## Acceptance

- [ ] Categories / status labels exact  
- [ ] Form validation messages exact  
- [ ] Ticket data shape exact  
- [ ] Contact guard on replies  
