# SMTP / `info@yeniform.com` — Yapılacaklar (Tamamen Ücretsiz)

Bu doküman, **yalnızca** `info@yeniform.com` adresini ücretsiz kurmak içindir: gelen mailleri almak ve aynı adresten cevap/gönderim yapmak.

## Durum (2026-08 tarama)

| Kontrol | Sonuç |
| --- | --- |
| Nameserver | **Turhost** (`dns1.turhost.com` / `dns2.turhost.com`) — DNS burada yönetilir |
| Kök MX | `0 yeniform.com.` → **bozuk / kendi kendine** — dışarıdan gelen mail kutuya düşmez |
| Resend (uygulama mailleri) | `send.yeniform.com` MX + kök SPF `amazonses` — **dokunma**; giden sistem mailleri ayrı |
| Gelen kutu | Henüz yok — aşağıdaki ImprovMX + Gmail kurulacak |

**Mevcut altyapı:**

| Parça | Nerede | Rol |
| --- | --- | --- |
| Domain sahibi + DNS | **Turhost** | NS burada; MX/SPF/TXT buraya eklenir |
| Site hosting | **Vercel** | `yeniform.com` A/CNAME (site) — mail MX’si Turhost’ta |
| Hedef gelen kutusu | **Gmail** (kişisel) | Mailleri burada okursun / cevaplarsın |
| Yönlendirme (receive) | **ImprovMX** (ücretsiz) | `info@` → Gmail’e forward |
| Gönderim (insan) | **Gmail “Send mail as”** | From = `info@yeniform.com` |
| Gönderim (uygulama) | **Resend** | Onay/red, şifre sıfırlama — [`OPS_RESEND_MAIL.md`](OPS_RESEND_MAIL.md) |

> **Önemli:** Nameserver Turhost olduğu için e-posta MX/TXT kayıtlarını **Turhost DNS**’e ekle. Vercel Domains’teki DNS bu domain için etkili değil (NS Turhost’tayken).

---

## 0) Bu kurulum ne yapar / ne yapmaz?

### Yapar

- Dışarıdan `info@yeniform.com` adresine mail gelince Gmail’ine düşer.
- Gmail’den **Kimden = info@yeniform.com** seçerek cevap yazar / yeni mail atarsın.
- Aylık ekstra ücret yok (domain yenileme hariç).

### Yapmaz

- Gerçek bir `info@` sunucu kutusu (IMAP/POP) açmaz; kutu Gmail’dir.
- Uygulamanın otomatik maillerini (kayıt, şifre sıfırlama, personel onay/red vb.) yönetmez — onlar **Resend** ile yapılır: [`docs/OPS_RESEND_MAIL.md`](OPS_RESEND_MAIL.md).
- Google Workspace / Microsoft 365 değildir; ekip büyürse ileride ücretli plana geçilebilir.
- ImprovMX ücretsiz planında **kendi SMTP’si yoktur**; gönderim Gmail SMTP ile yapılır (aşağıda).

### Neden Cloudflare Email Routing değil?

Cloudflare Email Routing ücretsizdir ama **DNS’in Cloudflare’de olması gerekir**. Sizde DNS **Vercel’de**. Nameserver’ları Cloudflare’e taşımak site DNS’ini de yeniden kurmayı gerektirir. Bu doküman Vercel DNS’i bozmadan ilerler: **ImprovMX + Gmail**.

---

## 1) Ön hazırlık kontrol listesi

Başlamadan emin ol:

1. [ ] `yeniform.com` Turhost’ta senin hesabında.
2. [ ] Domain nameserver’ları Vercel’i gösteriyor (Turhost → DNS / Nameserver).
3. [ ] Vercel Dashboard → Project → **Domains** → `yeniform.com` bağlı ve yeşil/aktif.
4. [ ] Kullanacağın kişisel Gmail açık (`ornek@gmail.com` gibi).
5. [ ] Gmail’de **2 Adımlı Doğrulama** açılabilir (App Password için zorunlu).
6. [ ] Bu dokümanda yalnızca `info@yeniform.com` kurulacak (başka alias yok).

Turhost nameserver kontrolü (örnek Vercel NS):

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

(Vercel’in gösterdiği tam değerler farklı olabilir; paneldekiyle birebir aynı olmalı.)

---

## 2) Mimari (nasıl çalışır?)

```text
                    ┌─────────────────────┐
  Gönderen kişi ──► │ MX: ImprovMX        │
  info@yeniform.com │ (Vercel DNS’te)     │
                    └──────────┬──────────┘
                               │ forward
                               ▼
                    ┌─────────────────────┐
                    │ Senin Gmail kutun   │
                    │ (okuma / arşiv)     │
                    └──────────┬──────────┘
                               │ “Send mail as”
                               │ SMTP: smtp.gmail.com
                               ▼
                    ┌─────────────────────┐
  Alıcı kişi ◄──── │ From: info@…        │
                    │ (Gmail üzerinden)   │
                    └─────────────────────┘
```

- **Gelen:** Internet → ImprovMX MX → Gmail  
- **Giden:** Gmail Compose → From `info@` → Google SMTP → alıcı  

---

## 3) ImprovMX hesabı (gelen mail — ücretsiz)

### 3.1 Hesap aç

1. Tarayıcıda aç: [https://improvmx.com](https://improvmx.com)
2. **Sign up / Log in** (Google ile veya e-posta ile).
3. Ücretsiz plan yeterli: domain başına sınırlı alias; sende sadece `info` olacak.

### 3.2 Domain ekle

1. Dashboard → **Add Domain** / **Add a domain**.
2. Domain: `yeniform.com` (www yazma).
3. Kaydet.

### 3.3 Alias tanımla (sadece info)

1. Domain satırına gir → **Aliases**.
2. **Add Alias**:
   - **Alias / Local part:** `info`
   - **Forward to:** kendi Gmail adresin (ör. `senin@gmail.com`)
3. Kaydet.

Sonuç: `info@yeniform.com` → `senin@gmail.com`

> Birden fazla kişiye düşürmek istersen (ileride): ImprovMX ücretsiz planda birden fazla destination destekliyorsa aynı alias’a ikinci Gmail ekle; yoksa Gmail’de otomatik iletme (filtre) kullan. Bu dokümanın hedefi tek adres / tek Gmail.

### 3.4 ImprovMX’in istediği DNS (not al)

ImprovMX genelde şunları ister (değerler panelde de yazar; paneldeki güncel değerler önceliklidir):

| Tip | Name / Host | Value | Priority |
| --- | --- | --- | --- |
| **MX** | `@` veya boş / `yeniform.com` | `mx1.improvmx.com` | **10** |
| **MX** | `@` veya boş / `yeniform.com` | `mx2.improvmx.com` | **20** |
| **TXT (SPF)** | `@` | aşağıdaki birleşik SPF | — |

> SPF’te ImprovMX + Google + Amazon SES (Resend) bir arada. **Aynı domainde birden fazla SPF TXT olmamalı** — tek kayıt, `include` birleştirilmiş.

---

## 4) Turhost DNS kayıtları (en kritik adım)

### 4.1 Panele gir

1. Turhost müşteri paneli → domain `yeniform.com`
2. **DNS yönetimi** / Zone Editor / DNS kayıtları

### 4.2 Eski / çakışan MX’leri temizle

1. Mevcut **MX** satırlarını bul (şu an muhtemelen `yeniform.com` priority 0 — sil).
2. Turhost “e-posta oluştur / Roundcube” kutusu açıksa ve MX’i kendine çekiyorsa kapat veya MX’i ImprovMX’e çevir.
3. Aynı anda iki sağlayıcı çalışmaz; kökte **yalnızca ImprovMX MX** kalsın.

Site A / CNAME kayıtlarına dokunma (Vercel site).  
`send` subdomain MX’ine (Resend bounce) **dokunma**.

### 4.3 Elle MX ekleme

**Kayıt 1**

- Type: `MX`
- Name / Host: `@` (veya boş / `yeniform.com` — Turhost ne istiyorsa)
- Value: `mx1.improvmx.com`
- Priority: `10`

**Kayıt 2**

- Type: `MX`
- Name: `@`
- Value: `mx2.improvmx.com`
- Priority: `20`

### 4.5 SPF (TXT) — tek kayıt, birleştirilmiş

1. Mevcut **TXT** içinde `v=spf1` ile başlayanı bul → **düzenle** (ikinci SPF ekleme).
2. Şu anki kayıt genelde yalnız `include:amazonses.com` (Resend). Bunu genişlet:

```text
v=spf1 include:spf.improvmx.com include:_spf.google.com include:amazonses.com ~all
```

| Alan | Değer |
| --- | --- |
| Type | `TXT` |
| Name | `@` |
| Value | `v=spf1 include:spf.improvmx.com include:_spf.google.com include:amazonses.com ~all` |

- **ImprovMX** → gelen forward  
- **Google** → Gmail “Send mail as”  
- **amazonses** → Resend uygulama mailleri (kalsın)

### 4.6 DMARC

Zaten `_dmarc` = `v=DMARC1; p=none` görünüyorsa bırak veya `rua` ekle:

```text
v=DMARC1; p=none; rua=mailto:info@yeniform.com
```

### 4.7 Turhost DNS — hedef görünüm (özet)

```text
MX   @   mx1.improvmx.com     10
MX   @   mx2.improvmx.com     20
TXT  @   v=spf1 include:spf.improvmx.com include:_spf.google.com include:amazonses.com ~all
TXT  _dmarc   v=DMARC1; p=none; ...
(+ site A/CNAME + Resend: send MX / resend._domainkey — dokunma)
```

---

## 5) DNS yayılımını doğrula

Değişiklik genelde dakikalar–birkaç saat; nadiren 24–48 saat.

### 5.1 ImprovMX paneli

1. ImprovMX → domain → **Check DNS** / **Check Again**.
2. Yeşil / “Email forwarding active” benzeri durum bekle.

### 5.2 Komut satırı (Mac Terminal)

```bash
dig MX yeniform.com +short
```

Beklenen (sıra farklı olabilir):

```text
10 mx1.improvmx.com.
20 mx2.improvmx.com.
```

```bash
dig TXT yeniform.com +short
```

Çıktıda SPF satırını gör:

```text
"v=spf1 include:spf.improvmx.com include:_spf.google.com ~all"
```

```bash
dig TXT _dmarc.yeniform.com +short
```

### 5.3 Online araçlar

- [https://mxtoolbox.com/SuperTool.aspx](https://mxtoolbox.com/SuperTool.aspx) → `yeniform.com` → MX + SPF  
- [https://dns.google](https://dns.google) → `yeniform.com` MX  

MX yanlış veya eski sağlayıcı hâlâ görünüyorsa Vercel’de eski MX’i silip tekrar kontrol et.

---

## 6) Gelen mail testi (henüz SMTP yok)

1. **Başka bir hesaptan** (Gmail dışı veya ikinci Gmail) şu adrese mail at:  
   `info@yeniform.com`
2. Konu: `TEST GELEN 1`
3. ImprovMX → Gmail’ine düşmeli (Inbox veya Promotions / Spam’e de bak).
4. Düşmüyorsa:
   - MX yayılmadı → dig ile tekrar bak
   - Alias yanlış → ImprovMX’te `info` → doğru Gmail mi?
   - Spam klasörü
   - ImprovMX dashboard’da hata / limit

Gelen test **başarılı olmadan** Send mail as’e geçme (onay maili de `info@` üzerinden gelecek).

---

## 7) Gmail’de gönderim (SMTP — “Send mail as”)

Cloudflare/ImprovMX ücretsiz forward **SMTP vermez**. Ücretsiz gönderim = Gmail’in kendi SMTP’si.

### 7.1 2 Adımlı Doğrulama

1. [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. **2-Step Verification** aç (telefon / Authenticator).

### 7.2 Uygulama şifresi (App Password)

1. [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
   (Menüde görünmüyorsa: Google Hesap → Güvenlik → 2 Adımlı → App passwords)
2. Uygulama: **Mail**
3. Cihaz: **Mac** / **Other** → isim: `yeniform-info`
4. **Generate** → 16 haneli şifreyi kopyala (boşluksuz sakla).  
   Normal Gmail şifreni kullanma.

### 7.3 “Başka adresten gönder” ekle

1. Gmail → sağ üst **dişli** → **See all settings** / Tüm ayarları görüntüle  
2. **Accounts** / **Hesaplar ve İçe Aktarma**  
3. **Send mail as** / **Başka bir e-posta adresinden posta gönder** → **Add another email address**

Popup:

| Alan | Değer |
| --- | --- |
| Name | `YeniForm` veya `YeniForm Bilgi` |
| Email address | `info@yeniform.com` |
| Treat as an alias | Genelde **işaretli kalsın** (yanıtların aynı thread’de toplanması için) |

**Next Step** / Sonraki adım.

### 7.4 SMTP sunucu ayarları (Gmail SMTP)

| Alan | Değer |
| --- | --- |
| SMTP Server | `smtp.gmail.com` |
| Port | `587` |
| Username | **Kendi Gmail adresin** (`senin@gmail.com`) — `info@` değil |
| Password | **App Password** (16 hane) |
| Secured connection | **TLS** (veya STARTTLS) |

**Add Account** / Hesap ekle.

> Username bilerek Gmail’dir. Google, senin hesabın üzerinden maili gönderir; From başlığında `info@yeniform.com` yazar.

### 7.5 Doğrulama maili

1. Google, `info@yeniform.com` adresine onay linki / kod gönderir.
2. ImprovMX bunu Gmail’ine forward eder.
3. Linke tıkla veya kodu popup’a yaz.
4. “Send mail as” listesinde `info@yeniform.com` görünmeli.

### 7.6 Varsayılan gönderici (isteğe bağlı)

Aynı Accounts sayfasında:

- `info@yeniform.com` yanında **make default** → her yeni mail bu adresten gider.  
- Yoksa Compose’da **From** açılır menüsünden seç.

---

## 8) Giden mail testi

1. Gmail → **Compose**.
2. **From:** `info@yeniform.com` seçili olsun.
3. Alıcı: dış bir adres (mümkünse Outlook / Yahoo / ikinci Gmail).
4. Konu: `TEST GIDEN info@`
5. Kısa gövde + imza (isteğe bağlı):

```text
YeniForm
info@yeniform.com
https://www.yeniform.com
```

6. Gönder.
7. Alıcıda:
   - From doğru mu? (`info@yeniform.com`)
   - Spam’e düştü mü?
   - Bazen “via gmail.com” notu görünür — ücretsiz Gmail SMTP’nin bilinen yan etkisi; işlevi bozmaz ama profesyonellik biraz düşer.

### 8.1 Giden SPF kontrolü (ileri)

Alıcı Gmail’de mail → üç nokta → **Show original** / Orijinali göster:

- `spf=pass` veya benzeri görmek iyi işaret.
- `fail` / `softfail` → Vercel SPF kaydını tekrar kontrol et (tek satır, Google include var mı?).

---

## 9) Günlük kullanım nasıl olacak?

| İhtiyaç | Ne yaparsın |
| --- | --- |
| Gelen müşteri maili | Gmail Inbox’ta `info@`’a gelenleri oku |
| Cevap yazma | Reply; From’un `info@` olduğundan emin ol |
| Yeni mail | Compose → From: `info@yeniform.com` |
| Mobil | Gmail iOS/Android uygulaması aynı hesabı kullanır; From seçilebilir |
| Etiket | Gmail filtresi: `to:info@yeniform.com` → etiket `YeniForm-Info` |

### 9.1 Basit Gmail filtresi

1. Gmail arama kutusu → filtre simgesi  
2. **To:** `info@yeniform.com`  
3. Create filter → Apply label `YeniForm-Info` → Never send to Spam (isteğe bağlı)

---

## 10) Turhost tarafında ne yapılır / ne yapılmaz?

### Yapılır (bir kez kontrol)

1. Turhost panel → domain `yeniform.com`  
2. Nameserver’ların **Vercel** olduğunu doğrula.  
3. Domain süresi dolmasın (yenileme hatırlatması).

### Yapılmaz

- Turhost’ta “E-posta oluştur / Hosting mail / Roundcube” açıp MX’i Turhost’a çekme.  
- Turhost DNS’ine MX ekleme (NS Vercel’deyse genelde işe yaramaz ve kafa karıştırır).  
- Ücretli Turhost mail paketi (bu doküman ücretsiz yol).

Özet: **Turhost = kayıt + DNS**, **Vercel = site hosting**, **ImprovMX = MX/forward**, **Gmail = kutu + insan SMTP**.

---

## 11) Site / uygulama e-postası ile karıştırma

| Tür | Adres örneği | Bu doküman mı? |
| --- | --- | --- |
| İnsan okur-yazar | `info@yeniform.com` | **Evet** |
| Auth (Supabase → Resend SMTP) | şifre sıfırlama, doğrulama | Hayır — [`OPS_RESEND_MAIL.md`](OPS_RESEND_MAIL.md) |
| Transactional (Resend API) | personel onay/red | Hayır — `RESEND_API_KEY` + [`api/_mailer.js`](../api/_mailer.js) |
| Admin hesap | `admin@yeniform.com` (uygulama login) | Hayır — Supabase Auth kullanıcısı; DNS mail ile aynı şey değil |

`info@` DNS MX’i ImprovMX’e verdikten sonra Turhost/eski mail kutuları o adrese gelmeyi **bırakır**. Yalnızca Gmail forward çalışır.

---

## 12) Sınırlar ve dürüst uyarılar

1. **Ücretsiz Gmail SMTP** bazı sağlayıcılarda (özellikle agresif filtreler) spam’e düşebilir; SPF + kısa, spam kelimesiz içerik yardımcı olur.  
2. **DKIM** özel domain için Google Workspace olmadan tam “Workspace kalitesi” değildir; “via gmail.com” görülebilir.  
3. Gmail günlük gönderim limiti ~**500** mail/gün (kişisel hesap) — destek/info için genelde yeter.  
4. ImprovMX ücretsiz plan: alias / forward limiti vardır; tek `info` için yeterli.  
5. ImprovMX ücretli SMTP ileride istenirse (DKIM’li temiz gönderim) opsiyonel yükseltme; **şimdilik zorunlu değil**.  
6. Google “Send mail as” özelliği uzun süredir var; teorik olarak değişebilir — o zaman Brevo/SMTP2GO ücretsiz katman veya ImprovMX SMTP düşünülür.

---

## 13) Sorun giderme

| Belirti | Olası neden | Çözüm |
| --- | --- | --- |
| Gelen mail yok | MX yayılmadı / yanlış MX | `dig MX`, Vercel’de yalnız ImprovMX MX |
| Gelen mail yok | Alias yok / yanlış Gmail | ImprovMX alias kontrol |
| Onay maili gelmedi | Gelen forward bozuk | Önce bölüm 6 testi |
| “Authentication failed” SMTP | Yanlış şifre | App Password yeniden üret; normal şifre kullanma |
| Username hatası | `info@` yazılmış | Username = Gmail adresin |
| Giden spam | SPF eksik / çoklu SPF | Tek SPF + Google include |
| Site açılmıyor | A/CNAME silindi | Vercel site kayıtlarını geri ekle; yalnızca MX/TXT e-posta için |
| Eski hosting maili geliyor | Eski MX hâlâ var | Vercel’den eski MX sil |

---

## 14) Adım adım özet (tek bakışta)

1. [ ] ImprovMX’e üye ol → domain `yeniform.com`  
2. [ ] Alias: `info` → kendi Gmail’in  
3. [ ] **Turhost DNS:** eski MX sil → `mx1` (10) + `mx2` (20)  
4. [ ] **Turhost DNS:** tek SPF = improvmx + google + amazonses  
5. [ ] ImprovMX → Check DNS → aktif  
6. [ ] Başka hesaptan `info@`’a test → **Gmail Inbox**  
7. [ ] Gmail 2FA + App Password  
8. [ ] Send mail as → From `info@yeniform.com`  
9. [ ] Giden test  

Mailleri **nerede görürsün?** → Kişisel **Gmail** (ImprovMX oraya forward eder). Ayrı Roundcube / Turhost webmail yok.

---

## 15) Referans linkler

- ImprovMX generic MX: [https://improvmx.com/guides/generic-dns-configuration/](https://improvmx.com/guides/generic-dns-configuration/)  
- SPF birleştirme: [https://improvmx.com/guides/combining-spf-records/](https://improvmx.com/guides/combining-spf-records/)  
- Google App Passwords: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
- MX Toolbox: [https://mxtoolbox.com](https://mxtoolbox.com)  

---

## 16) Bu repoda not

- Yasal metinlerde iletişim: `info@yeniform.com` / `destek@yeniform.com` geçebilir; DNS’te şimdilik **yalnızca `info`** kuruluyor.  
- `destek@` ileride aynı ImprovMX alias ile eklenebilir.  
- Uygulama kodunda değişiklik yok; Resend transactional ayrı kalır.

---

**Son durum hedefi:**  
Müşteri `info@yeniform.com` yazar → ImprovMX → senin Gmail’in → Gmail’den From=`info@` ile cevap. Ücretsiz; Turhost DNS + Gmail.
