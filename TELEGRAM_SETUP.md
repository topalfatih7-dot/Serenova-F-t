# Telegram Bildirim Kurulumu

Bu rehber, Yeni Form platformundaki kayıt, giriş ve çıkış olaylarının Telegram botunuza mesaj göndermesi için gereken adımları anlatır.

## Ne zaman bildirim gider?

| Olay | Telegram mesajı |
|------|-----------------|
| Yeni üye kaydı (ücretsiz) | Üye adı + e-posta + **Ücretsiz** |
| Yeni üye kaydı (premium) | Üye adı + e-posta + **Premium** |
| Üye girişi | Ad soyad |
| Üye çıkışı | Ad soyad |
| Koç / diyetisyen / doktor girişi | Ad soyad + rol |
| Personel çıkışı | Ad soyad + rol |
| Admin girişi | Admin |

---

## Adım 1 — Telegram botu oluşturun

1. Telegram'da **@BotFather**'ı açın.
2. `/newbot` yazın.
3. Bot için bir **isim** ve **kullanıcı adı** (ör. `yeni_form_bot`) belirleyin.
4. BotFather size **`123456789:AAH...`** formatında bir **token** verecek. Bunu güvenli bir yere kaydedin.

---

## Adım 2 — Chat ID'nizi bulun

Bot mesajları bir **sohbet kanalına veya size** gider. Chat ID gerekir.

### Kişisel bildirim (size gelsin)

1. Oluşturduğunuz bota Telegram'dan `/start` yazın (en az bir kez).
2. Tarayıcıda şu adresi açın (TOKEN yerine bot token'ınızı yazın):

   `https://api.telegram.org/botTOKEN/getUpdates`

3. JSON içinde `"chat":{"id":123456789}` değerini bulun. Bu sizin **TELEGRAM_CHAT_ID** değerinizdir.

### Grup / kanal bildirimi

1. Botu gruba ekleyin veya kanala admin yapın.
2. Grupta bir mesaj yazın.
3. Yine `getUpdates` ile `"chat":{"id":-1001234567890}` gibi (negatif olabilir) ID'yi alın.

---

## Adım 3 — Supabase Edge Function secret'larını tanımlayın

1. [Supabase Dashboard](https://supabase.com/dashboard) → projeniz → **Project Settings** → **Edge Functions**.
2. **Secrets** bölümüne ekleyin:

   | Secret adı | Değer |
   |------------|--------|
   | `TELEGRAM_BOT_TOKEN` | BotFather'dan aldığınız token |
   | `TELEGRAM_CHAT_ID` | Adım 2'deki chat id |

Alternatif (Supabase CLI):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=123456789:AAH...
supabase secrets set TELEGRAM_CHAT_ID=123456789
```

---

## Adım 4 — Edge Function'ı deploy edin

Proje klasöründe:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase functions deploy telegram-notify
```

Deploy sonrası fonksiyon adı: **`telegram-notify`**

Test (isteğe bağlı):

```bash
curl -X POST "https://YOUR-PROJECT-ref.supabase.co/functions/v1/telegram-notify" \
  -H "Authorization: Bearer YOUR-ANON-KEY" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"member_signup\",\"name\":\"Test Kullanıcı\",\"email\":\"test@ornek.com\",\"membership\":\"free\"}"
```

Telegram'da test mesajını görmelisiniz.

---

## Adım 5 — Veritabanı migration (doktor rolü + personel auth)

Supabase **SQL Editor**'da şu dosyayı çalıştırın:

`supabase/migrate_doctor_role.sql`

Bu migration:

- `doctor` rolünü staff tablosuna ekler
- Admin panelinden eklenen koç/diyetisyen/doktor için **Supabase Auth kullanıcısı** oluşturur
- Personelin `staff.id` değerini `auth.users.id` ile eşler
- Otomatik oluşan `members` satırını siler (personel üye listesinde görünmez)

---

## Adım 6 — Uygulamayı yeniden build / deploy edin

```bash
npm run build
```

Frontend'i (Vercel, Netlify vb.) güncel `dist` ile deploy edin.

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Telegram mesajı gelmiyor | Secret'ların doğru olduğunu ve `telegram-notify` deploy edildiğini kontrol edin |
| `403` / bot blocked | Bota `/start` yazın veya botu gruba ekleyin |
| Personel giriş yapamıyor | Admin panelinden personeli tekrar kaydedin; şifrenin PASSWORD_RULES'a uyduğundan emin olun |
| Koç müşteri paneline giriyor | `migrate_doctor_role.sql` çalıştırıldı mı? Personel e-postası `staff` tablosunda mı? |

---

## Güvenlik notları

- Bot token'ını **asla** frontend `.env` dosyasına veya GitHub'a koymayın.
- Token yalnızca Supabase Edge Function secret'larında tutulur.
- İstemci kodu sadece `supabase.functions.invoke('telegram-notify', …)` çağırır; token görmez.

---

## Dosya referansları

- Edge Function: `supabase/functions/telegram-notify/index.ts`
- İstemci çağrısı: `src/services/telegramNotify.js`
- Auth olayları: `src/services/supabaseDb.js` (`login`, `logout`, `register`, …)
