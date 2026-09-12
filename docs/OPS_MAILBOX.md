# Admin e-posta kutusu — ops

Admin panel `/admin/mail`: `info@` / `destek@` (ve eklenen alias’lar) gelen + giden kutu. Gönderim mevcut Resend API. Gelen: Resend Receiving webhook + “Gelenleri al” senkronu.

Uygulama mailleri (şifre, onay, yayın) ayrı kalır: [`OPS_RESEND_MAIL.md`](OPS_RESEND_MAIL.md).

## Kod

| Parça | Dosya |
| --- | --- |
| API | [`api/_mailbox.js`](../api/_mailbox.js) · `POST /api/contact` `action: admin_mailbox` |
| Webhook | aynı route, Svix başlıkları (`svix-id`) |
| UI | [`src/pages/admin/AdminMailboxPage.jsx`](../src/pages/admin/AdminMailboxPage.jsx) |

Env:

```bash
RESEND_API_KEY=re_...
MAIL_FROM=Yeni Form <info@yeniform.com>
RESEND_WEBHOOK_SECRET=whsec_...
```

`RESEND_WEBHOOK_SECRET` → Resend Dashboard → Webhooks → signing secret. Local gönderim için şart değil; gelen webhook için şart.

## DNS (production kesimi)

Nameserver **Turhost** (`dns1.turhost.com`). `send.yeniform.com` MX / DKIM **dokunma** (giden sistem mailleri).

Resend receiving MX (kök, öncelik mevcut ImprovMX’ten düşük sayı = daha yüksek öncelik):

| Tip | İsim | Değer | Öncelik |
| --- | --- | --- | --- |
| MX | `@` | `inbound-smtp.ap-northeast-1.amazonaws.com` | **9** |

ImprovMX `mx1` / `mx2` kayıtlarını sil (Gmail forward durur). Kökte bu tek MX kalsın.

Webhook (kurulu): event `email.received` → `https://www.yeniform.com/api/contact`.
Env: `RESEND_WEBHOOK_SECRET` (Production/Preview/Development).

Catch-all: `herhangi@yeniform.com` Resend’e düşer; panel yalnız kayıtlı alias’ları saklar.

## Turhost — tek kayıt (kesim)

1. Turhost → `yeniform.com` → DNS.
2. **Ekle** (ImprovMX’i henüz silme):

| Tip | İsim | Değer | Öncelik |
| --- | --- | --- | --- |
| MX | `@` | `inbound-smtp.ap-northeast-1.amazonaws.com` | **9** |

3. `dig MX yeniform.com +short` içinde `9 inbound-smtp.ap-northeast-1.amazonaws.com` görünce panele test maili at.
4. Panel Gelen’de görünce ImprovMX `mx1` / `mx2` sil.

`send` host MX / `resend._domainkey` **dokunma**.

## Local test

1. `npm run db:migrate`
2. `npm run dev:vercel` (API + Vite, port 3000)
3. Admin → E-posta yönetimi → Yeni mail
4. Gelen kutu, kök MX Resend olmadan `info@` ile dolmaz; “Gelenleri al” Resend receiving listesini çeker.
