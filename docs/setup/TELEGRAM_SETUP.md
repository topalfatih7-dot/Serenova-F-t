# Telegram Bildirim Kurulumu (Vercel)

Telegram bildirimleri **Supabase değil, projenizin Vercel API route'u** üzerinden çalışır.

```
Site (Vercel)  →  /api/telegram-notify  →  Telegram Bot API
                      ↑
              TELEGRAM_BOT_TOKEN (sunucuda, gizli)
```

---

## Ne zaman bildirim gider?

| Olay | Telegram mesajı |
|------|-----------------|
| Yeni üye kaydı (ücretsiz) | Ad + e-posta + **Ücretsiz** |
| Yeni üye kaydı (premium) | Ad + e-posta + **Premium** |
| Üye girişi / çıkışı | Ad soyad |
| Koç / diyetisyen / doktor girişi / çıkışı | Ad soyad + rol |
| Admin girişi | Admin |

---

## Adım 1 — Telegram botu oluşturun

1. Telegram'da **@BotFather** açın.
2. `/newbot` yazın.
3. Bot adı ve kullanıcı adı belirleyin (ör. `yeni_form_bot`).
4. BotFather'ın verdiği **token**'ı kaydedin: `123456789:AAH...`

---

## Adım 2 — Chat ID bulun

1. Bota Telegram'dan **`/start`** yazın.
2. Tarayıcıda açın (TOKEN yerine bot token'ınızı yazın):

   `https://api.telegram.org/botTOKEN/getUpdates`

3. JSON'da `"chat":{"id":123456789}` değerini bulun → **TELEGRAM_CHAT_ID**

**Grup/kanal için:** Botu gruba ekleyin, grupta mesaj yazın, aynı yöntemle id'yi alın (negatif olabilir: `-1001234567890`).

---

## Adım 3 — Vercel ortam değişkenlerini girin

[Vercel Dashboard](https://vercel.com) → Projeniz → **Settings** → **Environment Variables**

Aşağıdakileri **Production**, **Preview** ve **Development** için ekleyin:

### Zorunlu (sunucu — `VITE_` ÖNEKİ YOK)

| Değişken | Örnek | Açıklama |
|----------|-------|----------|
| `TELEGRAM_BOT_TOKEN` | `123456789:AAH...` | BotFather token |
| `TELEGRAM_CHAT_ID` | `123456789` | Giriş/kayıt bildirimleri chat id |
| `TELEGRAM_CONTACT_CHAT_ID` | `-1009876543210` | **Bize Ulaşın** formu — ayrı chat/grup id |
| `TELEGRAM_STAFF_APPLICATION_CHAT_ID` | `-100...` | **Kadro başvurusu** — yalnızca iletişim bilgileri |
| `TELEGRAM_CORPORATE_APPLICATION_CHAT_ID` | `-100...` | **Kurumsal başvuru** — yalnızca iletişim bilgileri |

> **Ayrı chat'ler:** Sistem bildirimleri, iletişim formu, kadro başvurusu ve kurumsal başvuru farklı Telegram sohbetlerine gider. Aynı bot token kullanılır; chat id'ler farklıdır.

> **Önemli:** `TELEGRAM_BOT_TOKEN` **asla** `VITE_TELEGRAM_BOT_TOKEN` olarak eklemeyin. `VITE_` ile başlayan değişkenler tarayıcıya gider ve herkes görebilir.

### Supabase (site zaten kullanıyorsa)

| Değişken | Açıklama |
|----------|----------|
| `VITE_SUPABASE_URL` | Supabase proje URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` veya `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

### İsteğe bağlı — spam koruması

| Değişken | Açıklama |
|----------|----------|
| `TELEGRAM_NOTIFY_SECRET` | Sunucu tarafı gizli anahtar (rastgele uzun string) |
| `VITE_TELEGRAM_NOTIFY_SECRET` | **Aynı değer** — istemci API'yi çağırırken gönderir |

İkisini de aynı rastgele değere ayarlarsanız, rastgele kişiler `/api/telegram-notify` endpoint'ini kötüye kullanamaz.

---

## Adım 4 — GitHub'a push edin ve Vercel deploy edin

1. Değişiklikleri GitHub'a push edin.
2. Vercel otomatik deploy eder **veya** Deployments → **Redeploy** yapın.
3. Env değişkenlerini ekledikten sonra mutlaka **yeniden deploy** edin; eski build env'i görmez.

Proje yapısı:

- `api/telegram-notify.js` → Vercel sunucu fonksiyonu
- `src/services/telegramNotify.js` → giriş/kayıt olaylarında çağrılır

**Supabase Edge Function deploy etmenize gerek yok.**

---

## Adım 5 — Test edin

Canlı sitenizde (ör. `https://siteniz.vercel.app`):

```bash
curl -X POST "https://SITENIZ.vercel.app/api/telegram-notify" \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"member_signup\",\"name\":\"Test Kullanıcı\",\"email\":\"test@ornek.com\",\"membership\":\"free\"}"
```

`TELEGRAM_NOTIFY_SECRET` kullanıyorsanız:

```bash
curl -X POST "https://SITENIZ.vercel.app/api/telegram-notify" \
  -H "Content-Type: application/json" \
  -H "X-Notify-Secret: SIZIN-SECRET" \
  -d "{\"event\":\"member_signup\",\"name\":\"Test\",\"email\":\"test@ornek.com\",\"membership\":\"free\"}"
```

Başarılı yanıt: `{"ok":true}` ve Telegram'da mesaj.

Ardından siteden gerçek giriş/kayıt deneyin.

---

## Yerel geliştirme

`npm run dev` (Vite) **API route'u çalıştırmaz**. Yerelde test için:

```bash
npm install -g vercel
vercel login
vercel link
vercel env pull .env.local
vercel dev
```

`.env.local` dosyasına `TELEGRAM_BOT_TOKEN` ve `TELEGRAM_CHAT_ID` ekleyin (Vercel'den pull edilir).

---

## Sorun giderme

| Sorun | Çözüm |
|-------|--------|
| Mesaj gelmiyor | Vercel env doğru mu? Deploy **sonrası** mı test ettiniz? |
| `503 Telegram yapılandırması eksik` | `TELEGRAM_BOT_TOKEN` veya `TELEGRAM_CHAT_ID` Vercel'de yok |
| `401 Yetkisiz istek` | `VITE_TELEGRAM_NOTIFY_SECRET` ile `TELEGRAM_NOTIFY_SECRET` aynı mı? |
| `502` Telegram hatası | Chat ID yanlış; bota `/start` yazın |
| Vercel'de env var ama çalışmıyor | **Redeploy** yapın |
| Supabase'e secret girdim | Artık gerek yok; yalnızca Vercel env kullanılır |

---

## Güvenlik

- Bot token **yalnızca** Vercel Environment Variables (`TELEGRAM_BOT_TOKEN`, `VITE_` **olmadan**).
- Token'ı GitHub'a commit etmeyin.
- `.env` dosyasını `.gitignore`'da tutun.

---

## Bize Ulaşın formu (ayrı Telegram chat)

Ana sayfadaki **Bize Ulaşın** formu `/api/contact` üzerinden **ayrı bir chat'e** gider.

### Vercel env

| Değişken | Açıklama |
|----------|----------|
| `TELEGRAM_CONTACT_CHAT_ID` | İletişim formu mesajlarının gideceği chat/grup id |

Aynı `TELEGRAM_BOT_TOKEN` kullanılır; yalnızca chat id farklıdır.

### Kurulum

1. Telegram'da **yeni bir grup** oluşturun (ör. "Yeni Form — İletişim").
2. Mevcut botunuzu gruba ekleyin.
3. Grupta bir mesaj yazın.
4. `getUpdates` ile grubun chat id'sini alın (genelde `-100...` ile başlar).
5. Vercel'e `TELEGRAM_CONTACT_CHAT_ID` olarak ekleyin.
6. Redeploy yapın.

### Test

```bash
curl -X POST "https://SITENIZ.vercel.app/api/contact" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Kullanıcı\",\"email\":\"test@test.com\",\"phone\":\"05551234567\",\"subject\":\"general\",\"message\":\"Bu bir test mesajıdır, en az on karakter.\"}"
```

Telegram iletişim grubunda mesaj görünmeli.

---

## Başvuru bildirimleri (ayrı Telegram chat'ler)

Kadro ve kurumsal başvurular Supabase'e kaydedildikten sonra `/api/application-notify` üzerinden **yalnızca iletişim bilgileri** ile ayrı chat'lere gider. Başvuru detayları (CV, mesaj, paket seçimi vb.) Telegram'a **gönderilmez** — admin panelinden görülür.

### Vercel env

| Değişken | Açıklama |
|----------|----------|
| `TELEGRAM_STAFF_APPLICATION_CHAT_ID` | Kadro başvurusu (koç/diyetisyen) bildirimleri |
| `TELEGRAM_CORPORATE_APPLICATION_CHAT_ID` | Kurumsal wellness başvuru bildirimleri |

Chat ID'leri henüz yoksa değişkeni boş bırakmayın — Vercel'e eklendiğinde redeploy yeterli. Chat ID tanımlı değilse başvuru yine kaydedilir; Telegram bildirimi atlanır.

### Kadro başvurusu mesaj içeriği

- Ad soyad, e-posta, telefon, rol (Koç/Diyetisyen)

### Kurumsal başvuru mesaj içeriği

- Şirket adı, yetkili adı, e-posta, telefon

### Test (kadro)

```bash
curl -X POST "https://SITENIZ.vercel.app/api/application-notify" \
  -H "Content-Type: application/json" \
  -H "X-Notify-Secret: SIZIN-SECRET" \
  -d '{"type":"staff_application","name":"Test Koç","email":"test@test.com","phone":"05551234567","roleLabel":"Koç"}'
```

### Test (kurumsal)

```bash
curl -X POST "https://SITENIZ.vercel.app/api/application-notify" \
  -H "Content-Type: application/json" \
  -H "X-Notify-Secret: SIZIN-SECRET" \
  -d '{"type":"corporate_application","companyName":"Test A.Ş.","contactName":"Ayşe Yılmaz","email":"info@test.com","phone":"05551234567"}'
```

---

## Dosya referansları

- Giriş/kayıt API: `api/telegram-notify.js`
- İletişim formu API: `api/contact.js`
- Başvuru bildirimleri API: `api/application-notify.js`
- Form bileşeni: `src/components/landing/ContactSection.jsx`
- İstemci: `src/services/contactForm.js`
- Başvuru istemci: `src/services/applicationNotify.js`
- Auth olayları: `src/services/supabaseDb.js`
