-- is_admin() members tablosunu okurken members_select RLS tekrar is_admin() çağırıyordu
-- → stack depth limit exceeded / statement timeout (HTTP 500)

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (auth.jwt() ->> 'email') = 'admin@serenova.fit',
    false
  )
  or exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'admin'
  );
$$;

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
    where m.id = p_member_id and s.email = public.current_email()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

revoke all on function public.staff_manages_member(uuid) from public;
grant execute on function public.staff_manages_member(uuid) to authenticated, anon;
