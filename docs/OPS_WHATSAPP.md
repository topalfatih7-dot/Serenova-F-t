# WhatsApp Business (Meta Cloud API) — OPS checklist

> Kod hazır · Dashboard şablonları + env + webhook kullanıcıda tamamlanmalı  
> Endpoint: `POST/GET /api/application-notify` (Expo + WA multiplex; yeni serverless yok)

## Env (Vercel + `.env.local`)

```
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_WABA_ID=
WHATSAPP_VERIFY_TOKEN=          # rastgele uzun secret; Meta webhook verify ile aynı
WHATSAPP_APP_SECRET=            # Meta App → Settings → Basic → App Secret
# WHATSAPP_GRAPH_VERSION=v22.0  # opsiyonel
```

Şablon: [`.env.example`](../.env.example)

## Meta kurulum

1. [ ] Meta Business doğrulama + WhatsApp Business Account
2. [ ] Telefon numarası ekle / display name onay
3. [ ] Permanent System User token → `WHATSAPP_TOKEN`
4. [ ] Phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
5. [ ] Webhook URL: `https://www.yeniform.com/api/application-notify`
   - Verify token = `WHATSAPP_VERIFY_TOKEN`
   - Subscribe: `messages` (delivery status)
6. [ ] Aşağıdaki **utility** şablonları `tr` dilinde oluştur → **APPROVED**

## Şablon metinleri (body değişkenleri sırayla)

| Template name | Body (örnek) |
|---------------|--------------|
| `appt_confirmed_member` | Merhaba {{1}}, randevunuz kaydedildi: {{2}}. Uzman: {{3}}. Panel: yeniform.com/schedule |
| `appt_confirmed_staff` | Yeni randevu: {{1}} — {{2}} ({{3}}). |
| `appt_reminder_24h` | {{1}}, {{2}} görüşmeniz yaklaşıyor: {{3}}. Panel: yeniform.com/schedule |
| `appt_reminder_1h` | {{1}}, {{2}} görüşmeniz 1 saat sonra: {{3}}. Panel: yeniform.com/schedule |
| `appt_cancelled` | {{1}} randevusu iptal edildi: {{2}}. |
| `appt_rescheduled` | {{1}} randevusu yeniden planlandı: {{2}} → {{3}}. |
| `program_ready` | {{1}}, {{2}} size "{{3}}" programını gönderdi. Panel: yeniform.com/programs |
| `new_chat_message` | {{1}}, {{2}} size yeni bir mesaj gönderdi. Panel: yeniform.com/messages |

Kategori: **Utility**. Marketing / İYS bu fazda yok.

## Otomatik tetikleyiciler

| Olay | Üye | Staff |
|------|-----|-------|
| Randevu kaydı | in-app + WA | in-app + WA |
| T-24s / T-1s (saatlik cron) | in-app + WA | in-app + WA |
| İptal / erteleme (üye) | — | in-app + WA |
| Program / diyet listesi | in-app + Expo + WA | — |
| Sohbet mesajı | WA (staff→üye; 30 dk throttle) | in-app + WA (üye→staff) |

Cron: `vercel.json` → `/api/ai-blog-generate?task=session-reminders` (`0 * * * *`, `CRON_SECRET`).

Opt-out: `settings.whatsappNotifs === false` (üye profil / staff güvenlik sekmesi). Telefon yoksa sessiz skip.

## Log

Tablo: `whatsapp_delivery_log` (service_role; phone hash). Delivery status webhook satırı günceller.

## Smoke

1. Sandbox/test numarasına şablon gönder (Graph API veya book-session).
2. Webhook verify GET → 200 + challenge.
3. Cron dry-run: `curl -H "Authorization: Bearer $CRON_SECRET" ".../api/ai-blog-generate?task=session-reminders"`.
