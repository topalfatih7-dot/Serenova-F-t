-- Görüntülü görüşme kayıtları (Daily.co cloud recording metadata)

create table if not exists public.session_recordings (
  id uuid primary key default gen_random_uuid(),
  daily_recording_id text not null unique,
  room_name text not null,
  session_id text not null,
  session_type text not null check (session_type in ('coach', 'dietitian', 'doctor')),
  member_id uuid references public.members(id) on delete set null,
  member_name text,
  staff_name text,
  duration_sec integer not null default 0,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  data jsonb not null default '{}'::jsonb,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_recordings_session_idx
  on public.session_recordings (session_id, session_type);

create index if not exists session_recordings_member_idx
  on public.session_recordings (member_id, recorded_at desc nulls last);

create index if not exists session_recordings_room_idx
  on public.session_recordings (room_name);

alter table public.session_recordings enable row level security;

drop policy if exists session_recordings_admin_select on public.session_recordings;
create policy session_recordings_admin_select on public.session_recordings
  for select using (public.is_admin());

drop policy if exists session_recordings_admin_all on public.session_recordings;
create policy session_recordings_admin_all on public.session_recordings
  for all using (public.is_admin()) with check (public.is_admin());
