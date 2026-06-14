-- Mevcut üyelerde atama yalnızca data JSONB içindeyse sütunlara taşır.
-- Supabase SQL Editor'da bir kez çalıştırın (RLS koç paneli sütunlara bakar).

update public.members
set
  assigned_coach_id = coalesce(
    assigned_coach_id,
    nullif(data ->> 'assignedCoachId', '')::uuid
  ),
  assigned_dietitian_id = coalesce(
    assigned_dietitian_id,
    nullif(data ->> 'assignedDietitianId', '')::uuid
  ),
  updated_at = now()
where
  (assigned_coach_id is null and coalesce(data ->> 'assignedCoachId', '') <> '')
  or (assigned_dietitian_id is null and coalesce(data ->> 'assignedDietitianId', '') <> '');
