-- Audit fix: programs RLS scoped to assigned clients, staff_applications RPC-only insert,
-- drop unused membership_requests table

create or replace function public.staff_manages_member(p_member_id uuid)
returns boolean language sql stable
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.members m
    join public.staff s on (s.id = m.assigned_coach_id or s.id = m.assigned_dietitian_id)
    where m.id = p_member_id and s.email = public.current_email()
  );
$$;

drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select using (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
);

drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs for all using (
  public.is_admin() or public.staff_manages_member(member_id)
) with check (
  public.is_admin() or public.staff_manages_member(member_id)
);

drop policy if exists staff_applications_insert on public.staff_applications;
create policy staff_applications_insert on public.staff_applications
  for insert with check (false);

drop policy if exists requests_select on public.membership_requests;
drop policy if exists requests_insert on public.membership_requests;
drop policy if exists requests_update on public.membership_requests;
drop table if exists public.membership_requests;
