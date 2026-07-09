-- Ops sağlık kontrolü — service_role cron için anlık metrikler.
-- anon/authenticated EXECUTE yok; yalnızca service_role.

create or replace function public.ops_health_snapshot()
returns jsonb
language sql
security definer
set search_path = public, storage, auth, pg_catalog
as $$
  select jsonb_build_object(
    'db_bytes', pg_database_size(current_database()),
    'db_pretty', pg_size_pretty(pg_database_size(current_database())),
    'active_connections', (
      select count(*)::int
      from pg_stat_activity
      where datname = current_database()
    ),
    'max_connections', (
      select setting::int from pg_settings where name = 'max_connections'
    ),
    'storage_bytes', (
      select coalesce(sum((metadata->>'size')::bigint), 0)::bigint
      from storage.objects
    ),
    'storage_objects', (
      select count(*)::int from storage.objects
    ),
    'storage_pretty', (
      select pg_size_pretty(coalesce(sum((metadata->>'size')::bigint), 0))
      from storage.objects
    ),
    'member_count', (select count(*)::int from public.members),
    'auth_user_count', (select count(*)::int from auth.users),
    'checked_at', now()
  );
$$;

revoke all on function public.ops_health_snapshot() from public;
revoke all on function public.ops_health_snapshot() from anon, authenticated;
grant execute on function public.ops_health_snapshot() to service_role;

comment on function public.ops_health_snapshot() is
  'Cron/ops sağlık metrikleri — yalnızca service_role';
