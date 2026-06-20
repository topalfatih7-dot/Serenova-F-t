-- Anlık aktif kullanıcı takibi + destek/ticket realtime

create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member',
  session_started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_path text
);

create index if not exists user_presence_last_seen_idx on public.user_presence(last_seen_at desc);

alter table public.user_presence enable row level security;

drop policy if exists user_presence_self on public.user_presence;
create policy user_presence_self on public.user_presence
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_presence_admin_select on public.user_presence;
create policy user_presence_admin_select on public.user_presence
  for select using (public.is_admin());

-- Herkese açık istatistik (anon dahil)
create or replace function public.get_online_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'online_now', (
      select count(*)::int from public.user_presence
      where last_seen_at > now() - interval '90 seconds'
    ),
    'total_members', (select count(*)::int from public.members)
  );
$$;

revoke all on function public.get_online_stats() from public;
grant execute on function public.get_online_stats() to anon, authenticated;

-- Admin: anlık aktif kullanıcı listesi
create or replace function public.get_active_users()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select
        user_id,
        email,
        name,
        role,
        session_started_at,
        last_seen_at,
        page_path,
        extract(epoch from (now() - session_started_at))::int as duration_seconds
      from public.user_presence
      where last_seen_at > now() - interval '90 seconds'
      order by session_started_at desc
    ) t
  );
end;
$$;

revoke all on function public.get_active_users() from public;
grant execute on function public.get_active_users() to authenticated;

-- Realtime yayını
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'user_presence'
  ) then
    alter publication supabase_realtime add table public.user_presence;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tickets'
  ) then
    alter publication supabase_realtime add table public.tickets;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'members'
  ) then
    alter publication supabase_realtime add table public.members;
  end if;
end $$;
