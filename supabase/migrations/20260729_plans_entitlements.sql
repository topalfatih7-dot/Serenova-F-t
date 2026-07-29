-- Plans: dynamic entitlements, sellable flag, billing type, emoji
-- Admin panel can create/edit/delete packages; Stripe validates against DB.

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS emoji text,
  ADD COLUMN IF NOT EXISTS is_sellable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'recurring',
  ADD COLUMN IF NOT EXISTS entitlements jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'plans_billing_type_check'
  ) THEN
    ALTER TABLE public.plans
      ADD CONSTRAINT plans_billing_type_check
      CHECK (billing_type IN ('recurring', 'one_time'));
  END IF;
END $$;

COMMENT ON COLUMN public.plans.emoji IS 'Optional emoji shown on plan cards (Lucide icon fallback)';
COMMENT ON COLUMN public.plans.is_sellable IS 'Visible in public pricing / accepted by Stripe checkout';
COMMENT ON COLUMN public.plans.billing_type IS 'recurring (duration tiers) or one_time (e.g. doctor)';
COMMENT ON COLUMN public.plans.entitlements IS 'Quotas + access flags: coach/dietitian/doctor meetings, calorie, video';

-- Seed entitlements + sellable for known sellable plans (only fill empty entitlements)
UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'recurring',
  entitlements = '{"coachMeetingsPerMonth":0,"dietitianMeetingsPerMonth":1,"doctorMeetingsPerMonth":1,"doctorSessionsTotal":0,"photoCalorie":true,"manualCalorie":true,"fullVideo":false}'::jsonb,
  updated_at = now()
WHERE id = 'eko_diyet'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'recurring',
  entitlements = '{"coachMeetingsPerMonth":0,"dietitianMeetingsPerMonth":2,"doctorMeetingsPerMonth":1,"doctorSessionsTotal":0,"photoCalorie":true,"manualCalorie":true,"fullVideo":false}'::jsonb,
  updated_at = now()
WHERE id = 'diyet'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'recurring',
  entitlements = '{"coachMeetingsPerMonth":1,"dietitianMeetingsPerMonth":0,"doctorMeetingsPerMonth":0,"doctorSessionsTotal":0,"photoCalorie":true,"manualCalorie":true,"fullVideo":true}'::jsonb,
  updated_at = now()
WHERE id = 'eko_spor'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'recurring',
  entitlements = '{"coachMeetingsPerMonth":2,"dietitianMeetingsPerMonth":0,"doctorMeetingsPerMonth":0,"doctorSessionsTotal":0,"photoCalorie":true,"manualCalorie":true,"fullVideo":true}'::jsonb,
  updated_at = now()
WHERE id = 'spor'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'one_time',
  entitlements = '{"coachMeetingsPerMonth":0,"dietitianMeetingsPerMonth":0,"doctorMeetingsPerMonth":0,"doctorSessionsTotal":1,"photoCalorie":false,"manualCalorie":false,"fullVideo":false}'::jsonb,
  updated_at = now()
WHERE id = 'doktor'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

UPDATE public.plans SET
  is_sellable = true,
  billing_type = 'recurring',
  entitlements = '{"coachMeetingsPerMonth":2,"dietitianMeetingsPerMonth":2,"doctorMeetingsPerMonth":1,"doctorSessionsTotal":0,"photoCalorie":true,"manualCalorie":true,"fullVideo":true}'::jsonb,
  updated_at = now()
WHERE id = 'vip'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);

-- Mark sellable even if entitlements already set (idempotent for known IDs)
UPDATE public.plans
SET is_sellable = true, updated_at = now()
WHERE id IN ('eko_diyet', 'diyet', 'eko_spor', 'spor', 'doktor', 'vip');

UPDATE public.plans
SET billing_type = 'one_time', updated_at = now()
WHERE id = 'doktor';

-- Legacy: not sellable
UPDATE public.plans
SET is_sellable = false, updated_at = now()
WHERE id IN ('free', 'eko', 'kurucu', 'gumus', 'altin', 'platinum', 'premium');

-- Ensure legacy eko has entitlements if empty
UPDATE public.plans SET
  entitlements = '{"coachMeetingsPerMonth":0,"dietitianMeetingsPerMonth":0,"doctorMeetingsPerMonth":0,"doctorSessionsTotal":0,"photoCalorie":false,"manualCalorie":true,"fullVideo":false}'::jsonb,
  updated_at = now()
WHERE id = 'eko'
  AND (entitlements IS NULL OR entitlements = '{}'::jsonb);
