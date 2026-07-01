-- Koç/diyetisyen/doktor atamaları: sütunlar tek kaynak; JSONB'deki kopyaları temizle

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
  assigned_doctor_id = coalesce(
    assigned_doctor_id,
    nullif(data ->> 'assignedDoctorId', '')::uuid
  ),
  updated_at = now()
where
  (assigned_coach_id is null and coalesce(data ->> 'assignedCoachId', '') <> '')
  or (assigned_dietitian_id is null and coalesce(data ->> 'assignedDietitianId', '') <> '')
  or (assigned_doctor_id is null and coalesce(data ->> 'assignedDoctorId', '') <> '');

update public.members
set
  data = data - 'assignedCoachId' - 'assignedDietitianId' - 'assignedDoctorId',
  updated_at = now()
where
  data ? 'assignedCoachId'
  or data ? 'assignedDietitianId'
  or data ? 'assignedDoctorId';
