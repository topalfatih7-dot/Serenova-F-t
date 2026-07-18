# F03 — Password Reset

1. `/forgot-password` → email  
2. `POST /api/auth` `password-reset` (+ captcha)  
3. E-posta link → deep link `auth/callback` → establish recovery session  
4. `/reset-password` → new password matching PASSWORD_RULES  
5. Success → login / dashboard  

Errors: unknown email (generic message), expired link, weak password.
