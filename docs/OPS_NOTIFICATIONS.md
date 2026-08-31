# Auth & Notification düzeltmeleri (2026-08-31)

Analiz sonrası uygulanan düzeltmeler. Mobil native rebuild **gerekmez** — değişiklikler web API, DB RLS ve GitHub Actions üzerindedir. Mevcut Android/iOS uygulama zaten `yeniform-alerts-v3` / `-silent` kanallarını kaydeder; backend artık sessiz tercihte doğru kanalı gönderir.

## Doğrulanan (kod değişikliği yok)

| Madde | Sonuç |
|---|---|
| KRIK 7 — staff `call-join` `sessionType` | Android `/(staff)/call/...` ve iOS `/staff/call/...` içinde `callJoinSessionType(data.sessionType)` tanımlı. |
| KRIK 8 — mobil collab thread kanalı | `subscribeStaffCollabChat` `doctor_id` filtresi ile `app/(staff)/_layout` ve collab inbox'ta abone. |

## Uygulanan düzeltmeler

### KRIK 2 — Web collab thread doktor filtresi

[`src/hooks/useRealtimeSync.js`](../src/hooks/useRealtimeSync.js): staff collab thread realtime artık `thread.doctorId` ile de eşleşir. Doktor kendi ekip sohbet güncellemesini kaçırmaz.

### KRIK 1 + Hobby cron — saatlik hatırlatma

Vercel Hobby **günde 1 cron**; saatlik ifade deploy'u kırar. Saatlik tetikleyici:

[`.github/workflows/session-reminders.yml`](../.github/workflows/session-reminders.yml)

- `15 * * * *` + `workflow_dispatch`
- `GET https://www.yeniform.com/api/ai-blog-generate?task=session-reminders`
- Header: `Authorization: Bearer ${{ secrets.CRON_SECRET }}`
- **Custom domain zorunlu** — `*.vercel.app` Vercel SSO arkasında, cron 401 alır (`HEALTH_CHECK_URL` varsayılanı `www.yeniform.com`).

GitHub repo secret `CRON_SECRET`, Vercel `CRON_SECRET` ile aynı olmalı (supabase-health workflow ile paylaşılır).

### KRIK 3 — Reminder Expo

[`api/_sessionReminders.js`](../api/_sessionReminders.js): üye in-app persist sonrası `sendExpoPushToMember`; personel `append_outbound_notification` (atomik) + `sendExpoPushToStaff`.

### KRIK 4 — Randevu bildirim yazımı atomik

- [`api/_bookSession.js`](../api/_bookSession.js): personel satırını RMW `.update({ data })` yerine `append_outbound_notification(staff)`.
- [`api/_respondSession.js`](../api/_respondSession.js): oturum durumu üyede güncellenir; bildirim ayrı RPC ile eklenir (eşzamanlı onayda bildirim kaybı azalır).

### KRIK 5 — `auth.role === 'cron'` dead code

[`api/application-notify.js`](../api/application-notify.js): `requireAuth` `{ ok, user }` döner, `role` yok. Cron bu endpoint'i kullanmaz. Yetki her zaman `canNotifyStaff` / `canNotifyMember`.

### KRIK 6 — Android remote kanal + ses tercihi

[`api/_expoPush.js`](../api/_expoPush.js): `settings.soundNotifs === false` → `channelId: yeniform-alerts-v3-silent` ve `sound: null`. Aksi halde `yeniform-alerts-v3` + `sound: default`.

### DB

Migration: [`supabase/migrations/20260904_auth_notify_hardening.sql`](../supabase/migrations/20260904_auth_notify_hardening.sql) (canlıya uygulandı).

- `tg_chat_message_touch_thread()` EXECUTE: anon/authenticated/public revoke (trigger durur; REST RPC kapanır).
- `device_push_tokens` + `chat_messages`/`chat_threads` RLS: `(select auth.uid())` / `(select is_admin())`.
- `influencer_earnings(member_id, payment_id)` covering index.

### Dashboard (manuel — SQL yok)

**Leaked Password Protection** hâlâ kapalı. Supabase Dashboard → Authentication → Attack Protection → HaveIBeenPwned açılmalı.  
Rehber: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Mobil build

Gerekmez. Token kaydı, kanal isimleri ve navigate map değişmedi.

Deploy sonrası kontrol:

1. GitHub Actions → Session reminders → Run workflow (CRON_SECRET yoksa job fail — secret ekle).
2. Üye `soundNotifs: false` iken Android remote push sessiz kanal.
3. Doktor staff web panelinde collab thread realtime.
