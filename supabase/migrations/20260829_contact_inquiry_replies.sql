-- Bize Ulaşın: admin e-posta yanıtları
alter table public.contact_inquiries
  add column if not exists replies jsonb not null default '[]'::jsonb,
  add column if not exists last_replied_at timestamptz;

comment on column public.contact_inquiries.replies is
  'Admin e-posta yanıtları: [{id, body, sentAt, sentByName, sentByEmail, mailId}]';

create index if not exists contact_inquiries_last_replied_at_idx
  on public.contact_inquiries (last_replied_at desc nulls last);
