-- members_staff_safe: SECURITY DEFINER → security_invoker
-- Personel RLS + staff_manages_member filtresi caller bağlamında çalışır;
-- iletişim alanları strip_member_contact_fields ile yine gizlenir.

drop view if exists public.members_staff_safe;

create view public.members_staff_safe
with (security_invoker = true)
as
select
  id,
  name,
  role,
  membership,
  membership_status,
  assigned_coach_id,
  assigned_dietitian_id,
  assigned_doctor_id,
  public.strip_member_contact_fields(data) as data,
  created_at,
  updated_at
from public.members
where public.staff_manages_member(id);

grant select on public.members_staff_safe to authenticated;
