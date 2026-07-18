# Contract — Supabase Tables (core)

| Table | Role |
|-------|------|
| members | id=auth.uid, email, name, phone, role, membership, membership_status, assigned_*_id, data JSONB |
| staff | id, email, name, role coach\|dietitian\|doctor, active, data JSONB |
| programs | member_id, staff_id, data JSONB |
| posts | published, data JSONB |
| tickets | member_id, status, data JSONB |
| activities | member_id, data JSONB |
| payments | member_id, data JSONB |
| site_content | kind, sort, data |
| exercises | metadata + video_url path, locations[], requires_machine |
| plans | pricing_tiers jsonb, features |
| staff_applications / corporate_applications / contact_inquiries | intake |
| chat_threads / chat_messages | member-staff chat |
| admin_staff_* / staff_collab_* | other chats |
| user_presence | admin active users |

RLS enabled; mobile uses user JWT only. Details in `supabase/setup.sql` + migrations.

## members.data (important keys)

healthTest, packageConfig, notifications[], coachSessions/dietitianSessions/doctorSessions (or equivalent keys used by mappers), completedActivities, settings, premiumExpiresAt (if stored in data — verify mapper), verification flags.
