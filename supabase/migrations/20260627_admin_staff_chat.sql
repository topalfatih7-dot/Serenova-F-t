-- Admin ↔ Personel mesajlaşma (danışan-personel denetimi mevcut chat_threads üzerinden)

create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id from public.staff s where s.email = public.current_email() limit 1;
$$;

revoke all on function public.current_staff_id() from public;
grant execute on function public.current_staff_id() to authenticated;

create table if not exists public.admin_staff_threads (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  last_message_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (staff_id)
);

create index if not exists admin_staff_threads_staff_idx on public.admin_staff_threads (staff_id);
create index if not exists admin_staff_threads_last_message_idx on public.admin_staff_threads (last_message_at desc nulls last);

create table if not exists public.admin_staff_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.admin_staff_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('admin', 'staff')),
  sender_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_staff_messages_thread_idx on public.admin_staff_messages (thread_id, created_at);

alter table public.admin_staff_threads enable row level security;
alter table public.admin_staff_messages enable row level security;

drop policy if exists admin_staff_threads_select on public.admin_staff_threads;
create policy admin_staff_threads_select on public.admin_staff_threads for select using (
  public.is_admin()
  or staff_id = public.current_staff_id()
);

drop policy if exists admin_staff_threads_insert on public.admin_staff_threads;
create policy admin_staff_threads_insert on public.admin_staff_threads for insert with check (
  public.is_admin()
  or staff_id = public.current_staff_id()
);

drop policy if exists admin_staff_threads_update on public.admin_staff_threads;
create policy admin_staff_threads_update on public.admin_staff_threads for update using (
  public.is_admin()
  or staff_id = public.current_staff_id()
) with check (
  public.is_admin()
  or staff_id = public.current_staff_id()
);

drop policy if exists admin_staff_messages_select on public.admin_staff_messages;
create policy admin_staff_messages_select on public.admin_staff_messages for select using (
  exists (
    select 1 from public.admin_staff_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.staff_id = public.current_staff_id()
      )
  )
);

drop policy if exists admin_staff_messages_insert on public.admin_staff_messages;
create policy admin_staff_messages_insert on public.admin_staff_messages for insert with check (
  exists (
    select 1 from public.admin_staff_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.staff_id = public.current_staff_id()
      )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_staff_threads'
  ) then
    alter publication supabase_realtime add table public.admin_staff_threads;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'admin_staff_messages'
  ) then
    alter publication supabase_realtime add table public.admin_staff_messages;
  end if;
exception when others then
  null;
end $$;
