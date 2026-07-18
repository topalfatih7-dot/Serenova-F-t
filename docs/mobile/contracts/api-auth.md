# Contract — POST /api/auth (LOCK)

Base: `{API_BASE}/api/auth`  
Method: POST  
Header: `Content-Type: application/json`  
Optional: `Authorization: Bearer <access_token>`

## password-login

### Request

```json
{
  "action": "password-login",
  "email": "user@example.com",
  "password": "Secret1!",
  "turnstileToken": ""
}
```

### Success

```json
{
  "ok": true,
  "session": {
    "access_token": "<jwt>",
    "refresh_token": "<refresh>"
  }
}
```

Client MUST `supabase.auth.setSession` with both tokens.

### Failure examples

```json
{ "error": "E-posta veya şifre hatalı." }
```

```json
{ "error": "Çok fazla deneme. Lütfen sonra tekrar deneyin." }
```

Status 429 for rate limit. Bot errors pass through API message.

---

## signup

### Request

```json
{
  "action": "signup",
  "email": "user@example.com",
  "password": "Secret1!",
  "name": "Ayşe Yılmaz",
  "turnstileToken": "<token>"
}
```

### Success

```json
{
  "ok": true,
  "authSessionToken": "<optional form session for unlock>"
}
```

### Known errors

| error / status | UX |
|----------------|-----|
| already_registered / 409 | Sign-in fallback; else “Bu e-posta adresi zaten kayıtlı…” |
| other error string | Show as-is |

After ok: `signInAfterSignup` / unlock path (web `ensureAuthForRegistration`).

---

## exercise-video-url

Auth required.

```json
{ "action": "exercise-video-url", "path": "gym100-0001.mp4" }
```

Success: `{ "url": "https://...signed...", "expiresIn": 900 }` or web’s actual fields — **verify response keys in `api/auth.js` before coding; do not invent**. Path must match `^[\w.-]+$`.

## exercise-video-urls

```json
{ "action": "exercise-video-urls", "paths": ["a.mp4", "b.mp4"] }
```

## book-session

See [api-book-session.md](api-book-session.md) (full LOCK).

## password-reset / email-*

Follow ForgotPasswordPage + AuthCallbackPage; do not invent alternate recovery API.

## Mobile PROD rule

No fallback to raw `signInWithPassword` when API unreachable (web only allows fallback in non-PROD).
