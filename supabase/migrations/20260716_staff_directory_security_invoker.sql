-- staff_directory: SECURITY DEFINER → security_invoker
-- Ham staff SELECT hâlâ admin/kendi kaydı; kamuya yalnızca strip edilmiş satırlar.

create table if not exists public.staff_public (
  id uuid primary key references public.staff(id) on delete cascade,
  name text not null default '',
  role text not null,
  active boolean not null default true,
  created_at timestamptz,
  data jsonb not null default '{}'::jsonb
);

create index if not exists staff_public_created_at_idx on public.staff_public (created_at);

alter table public.staff_public enable row level security;

drop policy if exists staff_public_select on public.staff_public;
create policy staff_public_select on public.staff_public
  for select to anon, authenticated
  using (true);

revoke all on public.staff_public from public;
grant select on public.staff_public to anon, authenticated;

create or replace function public.sync_staff_public_row()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.staff_public where id = old.id;
    return old;
  end if;

  insert into public.staff_public (id, name, role, active, created_at, data)
  values (
    new.id,
    coalesce(new.name, ''),
    new.role,
    coalesce(new.active, true),
    new.created_at,
    public.strip_staff_contact_fields(new.data)
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    active = excluded.active,
    created_at = excluded.created_at,
    data = excluded.data;

  return new;
end;
$$;

drop trigger if exists trg_staff_public_sync on public.staff;
create trigger trg_staff_public_sync
  after insert or update or delete on public.staff
  for each row execute function public.sync_staff_public_row();

-- Mevcut kadro satırlarını doldur
insert into public.staff_public (id, name, role, active, created_at, data)
select
  id,
  coalesce(name, ''),
  role,
  coalesce(active, true),
  created_at,
  public.strip_staff_contact_fields(data)
from public.staff
on conflict (id) do update set
  name = excluded.name,
  role = excluded.role,
  active = excluded.active,
  created_at = excluded.created_at,
  data = excluded.data;

drop view if exists public.staff_directory;
create view public.staff_directory
with (security_invoker = true)
as
select id, name, role, active, created_at, data
from public.staff_public;

grant select on public.staff_directory to anon, authenticated;

revoke all on function public.sync_staff_public_row() from public, anon, authenticated;
