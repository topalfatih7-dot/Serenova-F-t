-- Admin sepet göndericisi: bildirim / e-posta denetim kaydı.
-- Yalnız service_role (API requireAdmin). Anon/authenticated erişemez.

create table if not exists public.admin_outbound_messages (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  channel text not null check (channel in ('push', 'email')),
  title text not null,
  body text not null default '',
  recipient_count integer not null default 0,
  sent_count integer not null default 0,
  skip_count integer not null default 0,
  fail_count integer not null default 0,
  results jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_outbound_messages is
  'Admin panelinden gönderilen telefon bildirimi veya e-posta (sepet).';

create index if not exists admin_outbound_messages_created_at_idx
  on public.admin_outbound_messages (created_at desc);

alter table public.admin_outbound_messages enable row level security;
alter table public.admin_outbound_messages force row level security;

revoke all on table public.admin_outbound_messages from public, anon, authenticated;
grant select, insert on table public.admin_outbound_messages to service_role;

-- RLS açık + politika yok lint’ini kapatır; istemci yine 0 satır görür.
drop policy if exists admin_outbound_messages_deny_clients on public.admin_outbound_messages;
create policy admin_outbound_messages_deny_clients
  on public.admin_outbound_messages
  for all
  to anon, authenticated
  using (false)
  with check (false);

-- Service-role atomik in-app yazımı (JWT is_admin() service_role'da false).
create or replace function public.append_outbound_notification(
  p_audience text,
  p_user_id uuid,
  p_notification jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_user_id is null or p_notification is null then
    return;
  end if;

  if p_audience = 'staff' then
    update public.staff
    set data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      jsonb_build_array(p_notification) || coalesce(data->'notifications', '[]'::jsonb),
      true
    )
    where id = p_user_id;
    return;
  end if;

  update public.members
  set
    data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      jsonb_build_array(p_notification) || coalesce(data->'notifications', '[]'::jsonb),
      true
    ),
    updated_at = now()
  where id = p_user_id;
end;
$$;

revoke all on function public.append_outbound_notification(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.append_outbound_notification(text, uuid, jsonb) to service_role;
