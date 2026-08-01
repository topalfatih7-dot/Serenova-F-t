# Supabase E-posta Şablonları — Yeni Form

Bu klasördeki HTML dosyalarını Supabase Dashboard'a **manuel** yapıştırın.

**Proje:** Yeni Form · ref `rvzksmyhsgxgrxgeabmi`  
**Dashboard:** [Authentication → Email Templates](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/templates)

| Dosya | Dashboard şablonu | Konu satırı önerisi | Durum |
|-------|-------------------|---------------------|--------|
| `recovery.html` | **Reset Password** | `Yeni Form — Şifre sıfırlama bağlantınız` | Zorunlu |
| `magic-link.html` | **Magic Link** | `Yeni Form — E-posta doğrulama bağlantınız` | Zorunlu (profil doğrulama OTP) |
| `confirm-signup.html` | **Confirm signup** | — | **Kullanılmıyor** — kayıt sunucuda `email_confirm: true` ile açılır |

## Önemli — PKCE + token_hash

Uygulama `flowType: 'pkce'` kullanır. **Recovery** şablonunda `{{ .ConfirmationURL }}` yerine `{{ .TokenHash }}` zorunludur; aksi halde şifre sıfırlama farklı cihaz/tarayıcıda çalışmaz.

Repo şablonu zaten doğru link kullanır:

`{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery&next=reset-password`

## Özel gönderen (info@yeniform.com) — Resend SMTP

Varsayılan Supabase göndericisi (`noreply@mail.app.supabase.io`) saatte ~2 mail ile sınırlıdır; production için Custom SMTP gerekir.

Tam adımlar: [`docs/OPS_RESEND_MAIL.md`](../../docs/OPS_RESEND_MAIL.md)

Kısa özet:

1. [Authentication → SMTP Settings](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/smtp)
2. **Enable Custom SMTP**
3. Host `smtp.resend.com` · Port `465` · User `resend` · Password = `RESEND_API_KEY`
4. Sender: `info@yeniform.com` / `Yeni Form`
5. Resend’de `yeniform.com` domain verified olmalı

## Site URL

[Authentication → URL Configuration](https://supabase.com/dashboard/project/rvzksmyhsgxgrxgeabmi/auth/url-configuration)

- **Site URL:** `https://www.yeniform.com`
- **Redirect URLs:** `https://www.yeniform.com/**`, `https://yeniform.com/**`, `http://localhost:5173/**`, `http://localhost:3000/**`

Google OAuth markalama / Custom Domain: [`docs/OPS_GOOGLE_OAUTH.md`](../../docs/OPS_GOOGLE_OAUTH.md).

## Şablon subject (konu) alanları

Dashboard'da her şablonun **Subject** alanına Türkçe konu satırını girin (tablo yukarıda).
