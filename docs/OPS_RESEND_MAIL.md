# Resend e-posta — ops kurulumu

Transaction + Auth mailleri için **Resend** (ücretsiz katman ~3.000 mail/ay).

Kod tarafı hazır:

| Parça | Dosya |
| --- | --- |
| Resend helper | [`api/_mailer.js`](../api/_mailer.js) |
| Onay/red action | `POST /api/contact` · `action: staff_decision_notify` |
| Admin UI | Başvurular → Onayla / Reddet |

Auth (şifre sıfırlama, magic link) hâlâ **Supabase GoTrue** üzerinden gider; teslimat için Custom SMTP = Resend.

---

## 1) Resend hesabı

1. [https://resend.com](https://resend.com) → Sign up
2. **API Keys** → Create → `yeniform-prod` (Full access) → kopyala (`re_…`)
3. `.env.local` ve Vercel (Production + Preview):

```bash
RESEND_API_KEY=re_xxxxxxxx
MAIL_FROM=Yeni Form <info@yeniform.com>
```

Vercel’e ekledikten sonra **Redeploy** gerekir.

---

## 2) Domain doğrulama (`yeniform.com`)

1. Resend → **Domains** → Add → `yeniform.com` (yoksa)
2. Paneldeki DNS kayıtlarını **Vercel DNS**’e ekle (Turhost’ta nameserver Vercel ise kayıtlar Vercel’de):

Tipik kayıtlar (paneldeki değerler öncelikli):

| Tip | Name | Value |
| --- | --- | --- |
| TXT | `resend._domainkey` (veya paneldeki DKIM adı) | Resend DKIM değeri |
| TXT | `send` (veya SPF satırı) | `v=spf1 include:amazonses.com ~all` — **paneldeki SPF** |
| MX | `send` | `feedback-smtp….amazonses.com` (priority panelde) |

**Önemli:** Kök domain MX’ine dokunma (gelen `info@` ImprovMX/Gmail için ayrı). Resend genelde `send` subdomain kullanır; kök SPF’i bozmadan subdomain kayıtları yeter.

3. Resend → **Verify** → yeşil olana kadar bekle (dakikalar–saatler).
4. Domain verified olduktan sonra From: `info@yeniform.com` kullanılabilir.

Kontrol:

```bash
dig TXT resend._domainkey.yeniform.com +short
dig MX send.yeniform.com +short
```

**2026-08 tarama notu:** `resend._domainkey.yeniform.com` TXT ve `send.yeniform.com` MX (Amazon SES feedback) DNS’te zaten görünüyor; kök SPF `include:amazonses.com` içeriyor. Resend panelinde domain **Verified** değilse eksik SPF (send TXT) veya yeniden Verify gerekir.

---

## 3) Supabase Custom SMTP

[Authentication → SMTP Settings](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/smtp)

| Alan | Değer |
| --- | --- |
| Enable Custom SMTP | On |
| Sender email | `info@yeniform.com` |
| Sender name | `Yeni Form` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | aynı `RESEND_API_KEY` |

Kaydet. Sonra Auth Templates:

| Dashboard şablonu | Repo dosyası | Subject |
| --- | --- | --- |
| Reset Password | [`supabase/email-templates/recovery.html`](../supabase/email-templates/recovery.html) | `Yeni Form — Şifre sıfırlama bağlantınız` |
| Magic Link | [`supabase/email-templates/magic-link.html`](../supabase/email-templates/magic-link.html) | `Yeni Form — E-posta doğrulama bağlantınız` |

**Confirm signup** kullanılmıyor (kayıt sunucuda `email_confirm: true` ile açılıyor). Şablonu yapıştırmaya gerek yok.

Recovery şablonunda `{{ .TokenHash }}` **zorunlu** (PKCE). Ayrıntı: [`supabase/email-templates/README.md`](../supabase/email-templates/README.md).

URL Configuration:

- Site URL: `https://www.yeniform.com`
- Redirect URLs: `https://www.yeniform.com/**`, `https://yeniform.com/**`, `http://localhost:5173/**`

---

## 4) Smoke test

```bash
# Yerel .env.local yüklü olmalı
node scripts/mail-smoke.mjs --to=senin@gmail.com
```

Beklenen: Resend API 200 + gelen kutuda (spam’e bak) test maili.

Şifre sıfırlama: sitede `/forgot-password` → mail → link → `/reset-password`.

Personel: Admin → Başvurular → Onayla → başvurana şifreli mail; Reddet → sonuç maili.

---

## 5) Checklist

- [x] Resend hesabı + API key
- [x] `RESEND_API_KEY` + `MAIL_FROM` → `.env.local` + Vercel (Production/Preview/Development)
- [x] Domain `yeniform.com` verified (DKIM/SPF/MX subdomain)
- [x] Supabase Custom SMTP → Resend (auth recover mailleri Resend log’da görünüyor)
- [ ] Recovery + Magic Link şablonları Dashboard’da (Türkçe + TokenHash) ← **senin yapman gereken**
- [x] `node scripts/mail-smoke.mjs` OK (info@yeniform.com)
- [ ] Forgot-password link tıklama (şablon güncellendikten sonra)
- [ ] Staff approve/reject mail OK (Admin panelden canlı test)

---

## Sorun giderme

| Belirti | Çözüm |
| --- | --- |
| `RESEND_API_KEY tanımlı değil` | Env + redeploy |
| Domain not verified | DNS yayılımı / yanlış host |
| Auth maili gelmiyor | Supabase SMTP password = API key mi? |
| Onay maili yok, hesap var | Admin modal’daki uyarı + şifreyi manuel ilet; Resend log’a bak |
| Spam | DKIM verify + DMARC soft (`p=none`) |

İnsan iletişimi (`info@` gelen kutusu) ayrı: [`docs/SMTP_YAPILACAKLAR.md`](SMTP_YAPILACAKLAR.md).
