-- Expo push ticket receipts — teslimat sonradan sorgulanır.
-- Ticket kuyruğa alındı demektir; DeviceNotRegistered genelde receipt'te gelir.

create table if not exists public.push_receipts (
  ticket_id text primary key,
  user_id uuid,
  expo_push_token text,
  status text not null default 'pending'
    check (status in ('pending', 'ok', 'error', 'expired')),
  error_code text,
  created_at timestamptz not null default now(),
  checked_at timestamptz
);

create index if not exists push_receipts_pending_created_idx
  on public.push_receipts (created_at)
  where status = 'pending';

create index if not exists push_receipts_user_id_idx
  on public.push_receipts (user_id);

comment on table public.push_receipts is
  'Expo push ticket id → getReceipts tarama. Service role only.';

alter table public.push_receipts enable row level security;
alter table public.push_receipts force row level security;

revoke all on table public.push_receipts from public, anon, authenticated;
grant select, insert, update, delete on table public.push_receipts to service_role;

drop policy if exists push_receipts_deny_clients on public.push_receipts;
create policy push_receipts_deny_clients
  on public.push_receipts
  for all
  to anon, authenticated
  using (false)
  with check (false);
