-- Personel hydrate: e-posta/telefon içermeyen güvenli görünüm.
-- (members ham SELECT personelde UPDATE için RLS’te kalır; uygulama
--  members_staff_safe kullanır. UI + client strip ek katman.)

create or replace function public.strip_member_contact_fields(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select (coalesce(p_data, '{}'::jsonb))
    - 'phone'
    - 'phoneCountry'
    - 'email';
$$;

revoke all on function public.strip_member_contact_fields(jsonb) from public;
grant execute on function public.strip_member_contact_fields(jsonb) to authenticated, service_role;

drop view if exists public.members_staff_safe;
create view public.members_staff_safe as
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
