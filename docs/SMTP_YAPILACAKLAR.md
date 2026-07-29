# SMTP / `info@yeniform.com` — Yapılacaklar (Tamamen Ücretsiz)

Bu doküman, **yalnızca** `info@yeniform.com` adresini ücretsiz kurmak içindir: gelen mailleri almak ve aynı adresten cevap/gönderim yapmak.

**Mevcut altyapı (değiştirme):**

| Parça | Nerede | Rol |
| --- | --- | --- |
| Domain sahibi | **Turhost** | Domain satın alındı / yenilenir |
| DNS (MX, TXT, A, CNAME) | **Vercel** | Site + e-posta DNS kayıtları burada yönetilir |
| Site hosting | **Vercel** | `yeniform.com` uygulaması |
| Hedef gelen kutusu | **Gmail** (kişisel) | Gerçek posta kutusu (ücretsiz) |
| Yönlendirme (receive) | **ImprovMX** (ücretsiz plan) | `info@` → Gmail’e forward |
| Gönderim (send) | **Gmail “Send mail as” + SMTP** | Gmail’den `info@yeniform.com` olarak yazma |

> **Önemli:** Turhost panelinde DNS’i “Vercel’e verdiysen”, e-posta için MX/TXT kayıtlarını **Turhost’ta değil, Vercel DNS’te** ekleyeceksin. Turhost’ta nameserver’lar Vercel’i gösteriyorsa, Turhost’taki DNS satırları genelde etkisizdir.

---

## 0) Bu kurulum ne yapar / ne yapmaz?

### Yapar

- Dışarıdan `info@yeniform.com` adresine mail gelince Gmail’ine düşer.
- Gmail’den **Kimden = info@yeniform.com** seçerek cevap yazar / yeni mail atarsın.
- Aylık ekstra ücret yok (domain yenileme hariç).

### Yapmaz

- Gerçek bir `info@` sunucu kutusu (IMAP/POP) açmaz; kutu Gmail’dir.
- Uygulamanın otomatik maillerini (kayıt, şifre sıfırlama, Stripe vb.) yönetmez — onlar ayrı (Supabase / Resend vb.).
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
| **TXT (SPF)** | `@` | `v=spf1 include:spf.improvmx.com include:_spf.google.com ~all` | — |

> SPF’te hem ImprovMX hem Google var: gelen yönlendirme + Gmail’den gönderim için. **Aynı domainde birden fazla SPF TXT olmamalı** — tek kayıt, `include` birleştirilmiş.

---

## 4) Vercel DNS kayıtları (en kritik adım)

### 4.1 Panele gir

1. [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. `yeniform.com`’un bağlı olduğu projeyi aç **veya** hesap → **Domains**.
3. `yeniform.com` → **DNS** sekmesi.

### 4.2 Eski / çakışan MX’leri temizle

1. Mevcut kayıtlarda **MX** tipinde satır var mı bak.
2. Turhost, eski hosting, Google Workspace denemesi vb. MX varsa **sil**.
3. Aynı anda iki farklı mail sağlayıcısı (ör. Turhost mail + ImprovMX) çalışmaz; **yalnızca ImprovMX MX** kalmalı.

Site için **A / AAAA / CNAME** (Vercel) kayıtlarına dokunma.

### 4.3 Kolay yol: ImprovMX DNS Preset (varsa)

Vercel bazı hesaplarda:

1. DNS → **Add DNS Preset** (veya benzeri)
2. **ImprovMX [MX]** seç
3. **Add records**

Preset yalnızca ImprovMX MX + basit SPF ekler. Sonra SPF’i Google ile birleştirmeyi **elle** yap (bölüm 4.5).

### 4.4 Elle MX ekleme

**Kayıt 1**

- Type: `MX`
- Name: `@` (veya boş — Vercel’de kök domain için ne isteniyorsa)
- Value / Mail server: `mx1.improvmx.com`
- Priority: `10`
- TTL: Auto / 60

**Kayıt 2**

- Type: `MX`
- Name: `@`
- Value: `mx2.improvmx.com`
- Priority: `20`
- TTL: Auto

Kaydet. Yazımda sonda nokta (`.`) Vercel bazen ekler; `mx1.improvmx.com` yeterli.

### 4.5 SPF (TXT) — tek kayıt, birleştirilmiş

1. Mevcut **TXT** kayıtlarında `v=spf1` ile başlayan var mı bak.
2. Varsa **düzenle**; yoksa **yeni TXT** ekle.
3. İkinci bir SPF TXT **ekleme**.

Önerilen tek SPF değeri:

```text
v=spf1 include:spf.improvmx.com include:_spf.google.com ~all
```

| Alan | Değer |
| --- | --- |
| Type | `TXT` |
| Name | `@` |
| Value | `v=spf1 include:spf.improvmx.com include:_spf.google.com ~all` |

**Neden Google include?**  
Gmail “Send mail as” ile giden mailler Google sunucularından çıkar. Alıcı sunucular SPF’te Google’ı görmezse spam / reject riski artar.

**Başka `include` gerekirse** (ör. ileride Resend ile `info@` değil transactional domain):  
Aynı satıra ekle, örneğin `include:amazonses.com` — ama **lookup limiti 10**; şimdilik ImprovMX + Google yeterli.

### 4.6 (Önerilen) DMARC — soft başlangıç

Spam skorunu iyileştirmek için basit DMARC:

| Alan | Değer |
| --- | --- |
| Type | `TXT` |
| Name | `_dmarc` |
| Value | `v=DMARC1; p=none; rua=mailto:info@yeniform.com` |

- `p=none`: şimdilik sadece izle, agresif reddetme yok.  
- İleride `p=quarantine` düşünülebilir; erken `reject` önerme.

### 4.7 Vercel DNS — hedef görünüm (özet)

Kök domainde (e-posta ile ilgili) kabaca:

```text
MX   @   mx1.improvmx.com     10
MX   @   mx2.improvmx.com     20
TXT  @   v=spf1 include:spf.improvmx.com include:_spf.google.com ~all
TXT  _dmarc   v=DMARC1; p=none; rua=mailto:info@yeniform.com
```

(+ Vercel’in site için A/CNAME kayıtları — dokunma)

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

Özet: **Turhost = kayıt şirketi**, **Vercel = DNS**, **ImprovMX = MX/forward**, **Gmail = kutu + SMTP**.

---

## 11) Site / uygulama e-postası ile karıştırma

| Tür | Adres örneği | Bu doküman mı? |
| --- | --- | --- |
| İnsan okur-yazar | `info@yeniform.com` | **Evet** |
| Auth (Supabase) | kullanıcıya sistem maili | Hayır — Supabase SMTP / şablon |
| Transactional (Resend vb.) | fatura, bildirim | Hayır — `.env` API key |
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
2. [ ] Alias: `info` → Gmail  
3. [ ] Vercel DNS: MX `mx1` (10) + `mx2` (20)  
4. [ ] Vercel DNS: tek SPF `improvmx` + `_spf.google.com`  
5. [ ] (Opsiyonel) `_dmarc` TXT  
6. [ ] `dig` / ImprovMX check → aktif  
7. [ ] Dışarıdan `info@`’a test mail → Gmail’de gör  
8. [ ] Gmail 2FA + App Password  
9. [ ] Send mail as → SMTP `smtp.gmail.com:587`  
10. [ ] Onay linki → From: `info@` ile giden test  

---

## 15) Referans linkler

- ImprovMX + Vercel DNS: [https://improvmx.com/guides/vercel/](https://improvmx.com/guides/vercel/)  
- ImprovMX generic MX: [https://improvmx.com/guides/generic-dns-configuration/](https://improvmx.com/guides/generic-dns-configuration/)  
- SPF birleştirme: [https://improvmx.com/guides/combining-spf-records/](https://improvmx.com/guides/combining-spf-records/)  
- Google App Passwords: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)  
- MX Toolbox: [https://mxtoolbox.com](https://mxtoolbox.com)  
- Vercel Dashboard: [https://vercel.com/dashboard](https://vercel.com/dashboard)  

---

## 16) Bu repoda not

- Yasal metinlerde iletişim: `info@yeniform.com` / `destek@yeniform.com` geçebilir; DNS’te şimdilik **yalnızca `info`** kuruluyor.  
- `destek@` ileride aynı ImprovMX alias ile eklenebilir (aynı MX yeter; yeni alias + aynı veya farklı Gmail).  
- Uygulama kodunda SMTP değiştirmek **gerekmez**; bu insan iletişimi içindir.

---

**Son durum hedefi:**  
Müşteri `info@yeniform.com` yazar → sen Gmail’de okursun → Gmail’den `info@yeniform.com` olarak cevap verirsin. Turhost’ta domain kalır, DNS Vercel’de kalır, ekstra aylık ücret yok.
