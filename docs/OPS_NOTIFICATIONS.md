# Auth & Notification düzeltmeleri (2026-08-31)

Analiz sonrası uygulanan düzeltmeler.

## Cron (P0-2) — doğrulandı 2026-08-31

- Vercel `CRON_SECRET` canlı endpoint ile eşleşiyor: `GET /api/ai-blog-generate?task=session-reminders` → **HTTP 200** `{ ok, scanned: 1, sent: 0, marked: 0 }` (pencerede oturum yoktu).
- GitHub `CRON_SECRET` aynı secret’ı kullanıyor: `supabase-health.yml` **704** başarılı `schedule` koşusu (son: 2026-08-31 16:51 UTC).
- `session-reminders.yml` workflow **active** ama henüz 0 koşu — dosya yeni commit edildi; saatlik cron ilk saatte tetiklenir. `workflow_dispatch` bu ortamda GH token olmadığı için elle atılamadı; secret yoksa health check de fail ederdi.
- Custom domain: `https://www.yeniform.com` (SSO yok).

Canlı cihaz T-1s doğrulaması: personel uygulaması dağıtıldıktan sonra bir gelecek randevuyu T-1s penceresine sokup lock-screen push’u kontrol et.

## Personel Expo (P0-1)

Personel `device_push_tokens` satırı üretimde 0 — uygulama henüz personele dağıtılmamış. Dağıtım öncesi:

- iOS `app/staff/_layout.tsx` + Android `app/(staff)/_layout.tsx`: üye ile aynı ön-Alert; kalıcı redde `StaffPushPermissionBanner` → Ayarlar.
- `StaffProfileEditor`: `pushNotifs` / `soundNotifs`.
- Native rebuild **gerekir**.

## Expo receipts (P1-1)

Tablo `push_receipts`. Ticket kaydı `_expoPush.js`; tarama `?task=push-receipts` ve membership-expiry cron piggyback. `DeviceNotRegistered` token siler; `InvalidCredentials` Telegram ops.

## Hatırlatıcı (P1-2)

`waReminders` yalnızca Expo (veya skip) başarısından sonra yazılır. `errors.length > 0` → `ok: false` (Actions kırmızı). Sayfalama 200; `membership` NULL atlanmaz.

## Admin yayın (P2)

`MAX_RECIPIENTS` 200; Expo 100’lük batch; listede **Cihaz yok** rozeti; token yoksa e-posta yedeği.

## Mobil build

Personel izin UX + `DAILY` su/tavsiye + billing/announcement rota + ikon rozeti → **iOS ve Android native rebuild**. Cihaz kontrol listesi aşağıda.

---

## Önceki (2026-08-31 kod)

Mobil native rebuild **gerekmezdi** — o tur yalnızca web API / DB / Actions. Mevcut Android/iOS uygulama zaten `yeniform-alerts-v3` / `-silent` kanallarını kaydeder.

## Doğrulanan (kod değişikliği yok)

| Madde | Sonuç |
|---|---|
| KRIK 7 — staff `call-join` `sessionType` | Android `/(staff)/call/...` ve iOS `/staff/call/...` içinde `callJoinSessionType(data.sessionType)` tanımlı. |
| KRIK 8 — mobil collab thread kanalı | `subscribeStaffCollabChat` koç/diyetisyen filtresi ile collab inbox'ta abone. |

## Uygulanan düzeltmeler

### KRIK 2 — Web collab thread filtresi

[`src/hooks/useRealtimeSync.js`](../src/hooks/useRealtimeSync.js): staff collab thread realtime `thread.coachId` / `thread.dietitianId` ile eşleşir. Doktor personel rolü yoktur.

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

## Mobil build (bu tur)

Personel izin UX + `DAILY` su/tavsiye + billing/announcement rota + ikon rozeti için **iOS ve Android native rebuild** gerekir.

Dağıtım sonrası cihaz kontrolü (personel Expo):

1. Personel uygulamaya giriş → `device_push_tokens` satırı (`user_id` = `staff.id`).
2. Kalıcı izin reddi → banner “Ayarları aç”; izin verince token yazılır.
3. Profil → Push / ses anahtarları `staff.data.settings` içine kaydolur.
4. Üye randevu talebi + sohbet mesajı kilit ekranına düşer.
5. GitHub Actions → Session reminders ilk saatlik koşu: `ok`, `scanned`, `sent`, `errors`.
6. Üye `soundNotifs: false` iken Android remote push sessiz kanal.
