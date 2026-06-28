-- Personel RLS: e-posta eşleşmesini büyük/küçük harf duyarsız yap
-- (JWT e-postası ile staff.email farklı case olunca danışan listesi boş kalıyordu)

create or replace function public.staff_manages_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.members m
    join public.staff s on (s.id = m.assigned_coach_id or s.id = m.assigned_dietitian_id)
    where m.id = p_member_id
      and lower(s.email) = lower(public.current_email())
  );
$$;

create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id from public.staff s
  where lower(s.email) = lower(public.current_email())
  limit 1;
$$;

drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (
  public.is_admin()
  or id = auth.uid()
  or exists (
    select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and lower(s.email) = lower(public.current_email())
  )
);

drop policy if exists members_update on public.members;
create policy members_update on public.members for update using (
  public.is_admin()
  or id = auth.uid()
  or exists (
    select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and lower(s.email) = lower(public.current_email())
  )
);
