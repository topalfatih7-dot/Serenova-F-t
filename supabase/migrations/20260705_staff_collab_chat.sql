-- Koç ↔ Diyetisyen mesajlaşma (aynı danışanı paylaşan çiftler, madde 3-A)

create table if not exists public.staff_collab_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  coach_id uuid not null references public.staff(id) on delete cascade,
  dietitian_id uuid not null references public.staff(id) on delete cascade,
  last_message_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint staff_collab_threads_member_unique unique (member_id)
);

create index if not exists staff_collab_threads_coach_idx on public.staff_collab_threads (coach_id);
create index if not exists staff_collab_threads_dietitian_idx on public.staff_collab_threads (dietitian_id);
create index if not exists staff_collab_threads_last_message_idx on public.staff_collab_threads (last_message_at desc nulls last);

create table if not exists public.staff_collab_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.staff_collab_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('coach', 'dietitian')),
  sender_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists staff_collab_messages_thread_idx on public.staff_collab_messages (thread_id, created_at);

alter table public.staff_collab_threads enable row level security;
alter table public.staff_collab_messages enable row level security;

drop policy if exists staff_collab_threads_select on public.staff_collab_threads;
create policy staff_collab_threads_select on public.staff_collab_threads for select using (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
);

drop policy if exists staff_collab_threads_insert on public.staff_collab_threads;
create policy staff_collab_threads_insert on public.staff_collab_threads for insert with check (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
);

drop policy if exists staff_collab_threads_update on public.staff_collab_threads;
create policy staff_collab_threads_update on public.staff_collab_threads for update using (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
);

drop policy if exists staff_collab_messages_select on public.staff_collab_messages;
create policy staff_collab_messages_select on public.staff_collab_messages for select using (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (public.is_admin() or t.coach_id = auth.uid() or t.dietitian_id = auth.uid())
  )
);

drop policy if exists staff_collab_messages_insert on public.staff_collab_messages;
create policy staff_collab_messages_insert on public.staff_collab_messages for insert with check (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        (sender_type = 'coach' and t.coach_id = auth.uid())
        or (sender_type = 'dietitian' and t.dietitian_id = auth.uid())
        or public.is_admin()
      )
  )
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff_collab_threads'
  ) then
    alter publication supabase_realtime add table public.staff_collab_threads;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff_collab_messages'
  ) then
    alter publication supabase_realtime add table public.staff_collab_messages;
  end if;
end $$;
