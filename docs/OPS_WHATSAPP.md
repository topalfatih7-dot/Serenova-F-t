# WhatsApp Business (Meta Cloud API) — OPS checklist

> Kod hazır · Dashboard şablonları + env + webhook kullanıcıda tamamlanmalı  
> Endpoint: `POST/GET /api/application-notify` (WhatsApp Meta webhook + outbound events)

## Ücretsiz başlangıç (test modu)

Meta, WhatsApp ürünü eklenen her app’e **ücretsiz test telefon numarası** verir. Bu numaradan, doğrulanmış **en fazla 5 alıcıya** sınırsız şablon mesajı gönderebilirsin — ücret yok.

1. [developers.facebook.com](https://developers.facebook.com) → **Create App** (Business) → ürün: **WhatsApp**
2. **WhatsApp → API Setup**:
   - Temporary access token → `WHATSAPP_TOKEN`
   - Phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
   - WhatsApp Business Account ID → `WHATSAPP_WABA_ID`
3. **To** listesine kendi numaranı ekle → SMS/WhatsApp ile doğrula
4. `.env.local` değerlerini doldur
5. Smoke (opsiyonel lokal doğrulama): WhatsApp env doluyken Meta test numarasına şablon gönderimini panel veya API üzerinden kontrol edin.

```bash
# Örnek (CRON/API yerine manuel env kontrolü)
# WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID Vercel veya .env.local'de tanımlı olmalı
```

Varsayılan şablon `hello_world` (Meta’nın hazır onaylı test şablonu). Başarılıysa telefondan mesaj gelir ve `whatsapp_delivery_log` satırı yazılır.

### Ne ücretsiz / ne ücretli?

| Durum | Ücret |
|-------|--------|
| Test modu (sandbox numara → doğrulanmış 5 alıcı) | Ücretsiz |
| Kullanıcı size yazdıktan sonraki 24 saat (servis penceresi) — serbest metin + utility şablon | Ücretsiz |
| Production’da proaktif utility şablon (randevu, program, chat) | Mesaj başına (TR tarifesi düşük; platform ücreti yok) |
| Marketing şablon / toplu kampanya | Bu fazda yok |

Resmi olmayan kütüphaneler (Baileys, whatsapp-web.js) ban riski nedeniyle kullanılmaz; kod resmi Cloud API üzerindedir.

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

## Meta kurulum (production)

1. [ ] Meta Business doğrulama + WhatsApp Business Account
2. [ ] Telefon numarası ekle / display name onay
3. [ ] Permanent System User token → `WHATSAPP_TOKEN` (temporary token ~24 saat)
4. [ ] Phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
5. [ ] Webhook URL: `https://www.yeniform.com/api/application-notify`
   - Verify token = `WHATSAPP_VERIFY_TOKEN`
   - Subscribe: `messages` (delivery status)
6. [ ] Aşağıdaki **utility** şablonları `tr` dilinde oluştur → **APPROVED**
7. [ ] Aynı env’leri Vercel Production’a yaz

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

Kod eşlemesi: [`api/_whatsapp.js`](../api/_whatsapp.js) → `WA_TEMPLATES`.

## Otomatik tetikleyiciler

| Olay | Üye | Staff |
|------|-----|-------|
| Randevu kaydı | in-app + WA | in-app + WA |
| T-24s / T-1s (manuel / Pro cron) | in-app + WA | in-app + WA |
| İptal / erteleme (üye) | — | in-app + WA |
| Program / diyet listesi | in-app + WA | — |
| Sohbet mesajı | WA (staff→üye; 30 dk throttle) | in-app + WA (üye→staff) |

Cron: `session-reminders` Vercel Hobby saatlik cron engeli nedeniyle `vercel.json`’dan kaldırıldı. Manuel/dry-run: `curl -H "Authorization: Bearer $CRON_SECRET" ".../api/ai-blog-generate?task=session-reminders"`. Pro’ya geçince saatlik cron eklenebilir.

Opt-out: `settings.whatsappNotifs === false` (üye profil / staff güvenlik sekmesi). Telefon yoksa sessiz skip.

## Log

Tablo: `whatsapp_delivery_log` (service_role; phone hash). Delivery status webhook satırı günceller.

## Smoke

1. Sandbox/test numarasına şablon gönder (Meta API veya panel tetikleyicisi).
2. Webhook verify GET → 200 + challenge (`WHATSAPP_VERIFY_TOKEN` + `WHATSAPP_APP_SECRET`).
3. Cron dry-run: `curl -H "Authorization: Bearer $CRON_SECRET" ".../api/ai-blog-generate?task=session-reminders"`.
