-- Expo push token storage (mobile P3)
-- One active token row per user; service role reads for outbound push.

create table if not exists public.device_push_tokens (
  user_id uuid primary key references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'unknown',
  updated_at timestamptz not null default now()
);

create unique index if not exists device_push_tokens_token_uidx
  on public.device_push_tokens (expo_push_token);

alter table public.device_push_tokens enable row level security;

drop policy if exists "device_push_tokens_select_own" on public.device_push_tokens;
create policy "device_push_tokens_select_own"
  on public.device_push_tokens
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "device_push_tokens_insert_own" on public.device_push_tokens;
create policy "device_push_tokens_insert_own"
  on public.device_push_tokens
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "device_push_tokens_update_own" on public.device_push_tokens;
create policy "device_push_tokens_update_own"
  on public.device_push_tokens
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "device_push_tokens_delete_own" on public.device_push_tokens;
create policy "device_push_tokens_delete_own"
  on public.device_push_tokens
  for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.device_push_tokens to authenticated;
grant all on public.device_push_tokens to service_role;
