-- Admin e-posta kutusu: alias, şablon, thread, mesaj, ek.
-- Yalnız service_role (API requireAdmin). Anon/authenticated erişemez.

create table if not exists public.mailbox_aliases (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null default 'Yeni Form',
  signature text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists mailbox_aliases_email_idx
  on public.mailbox_aliases (lower(email));

create table if not exists public.mailbox_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null default '',
  body text not null default '',
  alias_id uuid references public.mailbox_aliases(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mailbox_threads (
  id uuid primary key default gen_random_uuid(),
  alias_id uuid references public.mailbox_aliases(id) on delete set null,
  subject text not null default '',
  subject_norm text not null default '',
  snippet text not null default '',
  folder text not null default 'inbox' check (folder in ('inbox', 'sent', 'archive')),
  unread_count integer not null default 0,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists mailbox_threads_folder_last_idx
  on public.mailbox_threads (folder, last_message_at desc);

create index if not exists mailbox_threads_alias_last_idx
  on public.mailbox_threads (alias_id, last_message_at desc);

create table if not exists public.mailbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.mailbox_threads(id) on delete cascade,
  alias_id uuid references public.mailbox_aliases(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  from_email text not null default '',
  from_name text not null default '',
  to_emails text[] not null default '{}',
  cc_emails text[] not null default '{}',
  subject text not null default '',
  html text not null default '',
  text_body text not null default '',
  resend_email_id text,
  message_id text,
  in_reply_to text,
  references_header text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists mailbox_messages_resend_email_id_idx
  on public.mailbox_messages (resend_email_id)
  where resend_email_id is not null;

create index if not exists mailbox_messages_thread_created_idx
  on public.mailbox_messages (thread_id, created_at);

create index if not exists mailbox_messages_message_id_idx
  on public.mailbox_messages (message_id)
  where message_id is not null;

create table if not exists public.mailbox_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.mailbox_messages(id) on delete cascade,
  filename text not null,
  content_type text not null default 'application/octet-stream',
  size_bytes integer not null default 0,
  storage_path text not null,
  content_id text,
  is_inline boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists mailbox_attachments_message_idx
  on public.mailbox_attachments (message_id);

comment on table public.mailbox_aliases is 'Admin kutusunun gönderen/alıcı @yeniform.com adresleri.';
comment on table public.mailbox_threads is 'Admin e-posta konuşmaları.';
comment on table public.mailbox_messages is 'Gelen/giden e-posta gövdeleri.';

alter table public.mailbox_aliases enable row level security;
alter table public.mailbox_aliases force row level security;
alter table public.mailbox_templates enable row level security;
alter table public.mailbox_templates force row level security;
alter table public.mailbox_threads enable row level security;
alter table public.mailbox_threads force row level security;
alter table public.mailbox_messages enable row level security;
alter table public.mailbox_messages force row level security;
alter table public.mailbox_attachments enable row level security;
alter table public.mailbox_attachments force row level security;

revoke all on table public.mailbox_aliases from public, anon, authenticated;
revoke all on table public.mailbox_templates from public, anon, authenticated;
revoke all on table public.mailbox_threads from public, anon, authenticated;
revoke all on table public.mailbox_messages from public, anon, authenticated;
revoke all on table public.mailbox_attachments from public, anon, authenticated;

grant select, insert, update, delete on table public.mailbox_aliases to service_role;
grant select, insert, update, delete on table public.mailbox_templates to service_role;
grant select, insert, update, delete on table public.mailbox_threads to service_role;
grant select, insert, update, delete on table public.mailbox_messages to service_role;
grant select, insert, update, delete on table public.mailbox_attachments to service_role;

drop policy if exists mailbox_aliases_deny_clients on public.mailbox_aliases;
create policy mailbox_aliases_deny_clients on public.mailbox_aliases
  for all to anon, authenticated using (false) with check (false);

drop policy if exists mailbox_templates_deny_clients on public.mailbox_templates;
create policy mailbox_templates_deny_clients on public.mailbox_templates
  for all to anon, authenticated using (false) with check (false);

drop policy if exists mailbox_threads_deny_clients on public.mailbox_threads;
create policy mailbox_threads_deny_clients on public.mailbox_threads
  for all to anon, authenticated using (false) with check (false);

drop policy if exists mailbox_messages_deny_clients on public.mailbox_messages;
create policy mailbox_messages_deny_clients on public.mailbox_messages
  for all to anon, authenticated using (false) with check (false);

drop policy if exists mailbox_attachments_deny_clients on public.mailbox_attachments;
create policy mailbox_attachments_deny_clients on public.mailbox_attachments
  for all to anon, authenticated using (false) with check (false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mailbox-attachments',
  'mailbox-attachments',
  false,
  8388608,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into public.mailbox_aliases (email, display_name, signature, is_active, sort_order)
values
  (
    'info@yeniform.com',
    'Yeni Form',
    'Yeni Form' || chr(10) || 'https://www.yeniform.com',
    true,
    0
  ),
  (
    'destek@yeniform.com',
    'Yeni Form Destek',
    'Yeni Form Destek' || chr(10) || 'https://www.yeniform.com',
    true,
    1
  )
on conflict do nothing;

insert into public.mailbox_templates (name, subject, body, alias_id)
select
  'Bilgi alındı',
  'Talebiniz alındı',
  'Merhaba,' || chr(10) || chr(10) || 'Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.' || chr(10) || chr(10) || 'Sevgiler,' || chr(10) || 'Yeni Form',
  a.id
from public.mailbox_aliases a
where lower(a.email) = 'info@yeniform.com'
  and not exists (select 1 from public.mailbox_templates t where t.name = 'Bilgi alındı')
limit 1;

insert into public.mailbox_templates (name, subject, body, alias_id)
select
  'Teşekkür',
  'Teşekkürler',
  'Merhaba,' || chr(10) || chr(10) || 'Yazılarınız için teşekkür ederiz.' || chr(10) || chr(10) || 'Sevgiler,' || chr(10) || 'Yeni Form',
  a.id
from public.mailbox_aliases a
where lower(a.email) = 'info@yeniform.com'
  and not exists (select 1 from public.mailbox_templates t where t.name = 'Teşekkür')
limit 1;
