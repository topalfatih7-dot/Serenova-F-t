# Supabase E-posta Şablonları — Yeni Form

Bu klasördeki HTML dosyalarını Supabase Dashboard'a **manuel** yapıştırın.

**Proje:** Yeni Form · ref `rvzksmyhsgxgrxgeabmi`  
**Dashboard:** [Authentication → Email Templates](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/templates)

| Dosya | Dashboard şablonu | Konu satırı önerisi |
|-------|-------------------|---------------------|
| `recovery.html` | **Reset Password** | `Yeni Form — Şifre sıfırlama bağlantınız` |
| `magic-link.html` | **Magic Link** | `Yeni Form — E-posta doğrulama bağlantınız` |
| `confirm-signup.html` | **Confirm signup** | `Yeni Form — Hesabınızı doğrulayın` |

## Önemli — PKCE + token_hash

Uygulama `flowType: 'pkce'` kullanır. **Recovery** şablonunda `{{ .ConfirmationURL }}` yerine `{{ .TokenHash }}` zorunludur; aksi halde şifre sıfırlama farklı cihaz/tarayıcıda çalışmaz.

## Özel gönderen (info@yeniform.com)

Varsayılan Supabase göndericisi (`noreply@mail.app.supabase.io`) yerine kendi adresiniz için:

1. [Authentication → SMTP Settings](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/smtp)
2. **Enable Custom SMTP**
3. Önerilen değerler:
   - **Sender email:** `info@yeniform.com`
   - **Sender name:** `Yeni Form`
   - SMTP sağlayıcı: Resend, SendGrid, Brevo, Amazon SES vb. (domain DNS kayıtları gerekir)

`info@yeniform.com` için domain sağlayıcınızda SPF, DKIM ve (önerilen) DMARC kayıtlarını SMTP sağlayıcınızın verdiği değerlerle ekleyin.

## Site URL

[Authentication → URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

- **Site URL:** `https://www.yeniform.com`
- **Redirect URLs:** `https://www.yeniform.com/**`, `http://localhost:5173/**`, `http://localhost:3000/**`

## Şablon subject (konu) alanları

Dashboard'da her şablonun **Subject** alanına Türkçe konu satırını girin (tablo yukarıda).
