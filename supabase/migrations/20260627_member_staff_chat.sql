-- Üye ↔ atanmış koç/diyetisyen mesajlaşma (paket kapsamına göre)
-- Mesajlar kalıcı; uyumluluk ve süreç takibi için saklanır.

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  staff_id uuid not null references public.staff(id) on delete cascade,
  staff_role text not null check (staff_role in ('coach', 'dietitian')),
  last_message_at timestamptz,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (member_id, staff_role)
);

create index if not exists chat_threads_member_idx on public.chat_threads (member_id);
create index if not exists chat_threads_staff_idx on public.chat_threads (staff_id);
create index if not exists chat_threads_last_message_idx on public.chat_threads (last_message_at desc nulls last);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_type text not null check (sender_type in ('member', 'staff', 'system')),
  sender_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

alter table public.chat_threads enable row level security;
alter table public.chat_messages enable row level security;

-- Thread erişimi: üye kendi thread'i; personel atanmış danışan; admin
drop policy if exists chat_threads_select on public.chat_threads;
create policy chat_threads_select on public.chat_threads for select using (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
);

drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert on public.chat_threads for insert with check (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
);

drop policy if exists chat_threads_update on public.chat_threads;
create policy chat_threads_update on public.chat_threads for update using (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
) with check (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
);

-- Mesaj erişimi: thread'e erişimi olanlar
drop policy if exists chat_messages_select on public.chat_messages;
create policy chat_messages_select on public.chat_messages for select using (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.member_id = auth.uid()
        or public.staff_manages_member(t.member_id)
      )
  )
);

drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert on public.chat_messages for insert with check (
  exists (
    select 1 from public.chat_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.member_id = auth.uid()
        or public.staff_manages_member(t.member_id)
      )
  )
);

-- Realtime
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_threads'
  ) then
    alter publication supabase_realtime add table public.chat_threads;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'chat_messages'
  ) then
    alter publication supabase_realtime add table public.chat_messages;
  end if;
exception when others then
  null;
end $$;
