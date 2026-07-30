-- WhatsApp Cloud API delivery audit (PII minimized: phone hash only).
-- Access: service_role only.

create table if not exists public.whatsapp_delivery_log (
  id uuid primary key default gen_random_uuid(),
  recipient_role text not null check (recipient_role in ('member', 'staff')),
  recipient_id uuid,
  phone_hash text,
  template text not null,
  meta_message_id text,
  status text not null default 'queued',
  error text,
  event text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_delivery_log_created_at_idx
  on public.whatsapp_delivery_log (created_at desc);

create index if not exists whatsapp_delivery_log_meta_message_id_idx
  on public.whatsapp_delivery_log (meta_message_id)
  where meta_message_id is not null;

alter table public.whatsapp_delivery_log enable row level security;

revoke all on table public.whatsapp_delivery_log from public, anon, authenticated;
grant all on table public.whatsapp_delivery_log to service_role;
