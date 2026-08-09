-- cancel_pending / admin_cancel_pending: slot dolu kalsın (iptal onaylanana kadar)
create or replace function public.staff_booked_slots(
  p_staff_id uuid,
  p_type text,
  p_from timestamptz,
  p_to timestamptz
) returns setof timestamptz
language sql
security definer
set search_path = public, pg_temp
as $$
  select (s->>'date')::timestamptz
  from public.members m
  cross join lateral jsonb_array_elements(
    coalesce(
      m.data -> (case lower(p_type)
        when 'coach' then 'coachSessions'
        when 'doctor' then 'doctorSessions'
        else 'dietitianSessions' end),
      '[]'::jsonb)
  ) as s
  where (
    (lower(p_type) = 'coach'
      and (m.assigned_coach_id = p_staff_id or m.data->>'assignedCoachId' = p_staff_id::text))
    or (lower(p_type) = 'dietitian'
      and (m.assigned_dietitian_id = p_staff_id or m.data->>'assignedDietitianId' = p_staff_id::text))
    or (lower(p_type) = 'doctor'
      and (m.assigned_doctor_id = p_staff_id or m.data->>'assignedDoctorId' = p_staff_id::text))
  )
  and coalesce(s->>'status', 'scheduled') in (
    'pending',
    'scheduled',
    'rescheduled',
    'cancel_pending',
    'admin_cancel_pending'
  )
  and (s->>'date') is not null
  and (s->>'date') ~ '^\d{4}-\d{2}-\d{2}T'
  and (s->>'date')::timestamptz >= p_from
  and (s->>'date')::timestamptz < p_to;
$$;
