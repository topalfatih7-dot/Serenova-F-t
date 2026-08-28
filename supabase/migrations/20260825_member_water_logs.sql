-- Su takibi: günlük ml kayıtları (sık yazım) + diyetisyen/admin hedef RPC
-- Hedef members.data.waterTracking JSONB’de; üye saveMemberPatch ile hedefi değiştiremez.

create table if not exists public.member_water_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members (id) on delete cascade,
  local_date date not null,
  amount_ml integer not null,
  logged_at timestamptz not null default now(),
  source text not null default 'member',
  constraint member_water_logs_amount_chk check (amount_ml >= 1 and amount_ml <= 1000),
  constraint member_water_logs_source_chk check (source = 'member')
);

create index if not exists member_water_logs_member_date_idx
  on public.member_water_logs (member_id, local_date);

alter table public.member_water_logs enable row level security;

drop policy if exists member_water_logs_select on public.member_water_logs;
create policy member_water_logs_select
  on public.member_water_logs
  for select
  to authenticated
  using (
    member_id = (select auth.uid())
    or public.is_admin()
    or public.staff_manages_member(member_id)
  );

drop policy if exists member_water_logs_insert on public.member_water_logs;
create policy member_water_logs_insert
  on public.member_water_logs
  for insert
  to authenticated
  with check (
    member_id = (select auth.uid())
    and source = 'member'
  );

drop policy if exists member_water_logs_delete on public.member_water_logs;
create policy member_water_logs_delete
  on public.member_water_logs
  for delete
  to authenticated
  using (member_id = (select auth.uid()));

revoke all on table public.member_water_logs from anon, public;
grant select, insert, delete on table public.member_water_logs to authenticated;
grant all on table public.member_water_logs to service_role;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'member_water_logs'
  ) then
    alter publication supabase_realtime add table public.member_water_logs;
  end if;
end $$;

create or replace function public.set_member_water_goal(p_member_id uuid, p_goal_ml integer)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_staff_role text;
  v_staff_name text;
  v_is_admin boolean;
  v_goal integer;
  v_tracking jsonb;
begin
  if p_member_id is null then
    raise exception 'Üye gerekli';
  end if;

  v_goal := p_goal_ml;
  if v_goal is null or v_goal < 500 or v_goal > 5000 then
    raise exception 'Hedef 500–5000 ml olmalı';
  end if;

  v_is_admin := public.is_admin();
  if v_is_admin then
    v_staff_role := 'admin';
    v_staff_name := 'Admin';
  else
    select role, name into v_staff_role, v_staff_name
    from public.staff
    where id = (select auth.uid());

    if v_staff_role is distinct from 'dietitian' then
      raise exception 'Yalnızca diyetisyen hedefi değiştirebilir';
    end if;
    if not public.staff_manages_member(p_member_id) then
      raise exception 'Yetki yok';
    end if;
  end if;

  v_tracking := jsonb_build_object(
    'dailyGoalMl', v_goal,
    'goalUpdatedAt', to_char(now() at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
    'goalUpdatedBy', jsonb_build_object(
      'id', (select auth.uid()),
      'name', coalesce(v_staff_name, 'Uzman'),
      'role', v_staff_role
    )
  );

  update public.members
  set
    data = jsonb_set(coalesce(data, '{}'::jsonb), '{waterTracking}', v_tracking, true),
    updated_at = now()
  where id = p_member_id;

  if not found then
    raise exception 'Üye bulunamadı';
  end if;

  return v_tracking;
end;
$$;

revoke all on function public.set_member_water_goal(uuid, integer) from public, anon;
grant execute on function public.set_member_water_goal(uuid, integer) to authenticated, service_role;
