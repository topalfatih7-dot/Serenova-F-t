# Contract — POST /api/contact

Public forms. Body includes `action`:

| action | Purpose |
|--------|---------|
| contact | Bize ulaşın |
| staff_application | Kadro başvurusu |
| corporate_application | Kurumsal |
| staff_doc_upload | Başvuru doküman |

Turnstile + rate limit + honeypot. Service role RPCs server-side.

Mobile: same endpoints; captcha strategy per 05-auth-onboarding.
