-- Kurumsal başvurular
create table if not exists public.corporate_applications (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'contacted')),
  company_name text not null,
  contact_name text not null,
  email text not null,
  phone text default '',
  data jsonb not null default '{}'::jsonb,
  admin_note text default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists corporate_applications_status_idx on public.corporate_applications (status, created_at desc);

alter table public.corporate_applications enable row level security;

drop policy if exists corporate_applications_admin_select on public.corporate_applications;
create policy corporate_applications_admin_select on public.corporate_applications
  for select using (public.is_admin());

drop policy if exists corporate_applications_admin_update on public.corporate_applications;
create policy corporate_applications_admin_update on public.corporate_applications
  for update using (public.is_admin()) with check (public.is_admin());

-- Bize ulaşın / iletişim formları
create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  name text not null,
  email text not null,
  phone text default '',
  subject text default 'general',
  message text not null,
  source text default 'landing',
  created_at timestamptz not null default now()
);

create index if not exists contact_inquiries_status_idx on public.contact_inquiries (status, created_at desc);

alter table public.contact_inquiries enable row level security;

drop policy if exists contact_inquiries_admin_select on public.contact_inquiries;
create policy contact_inquiries_admin_select on public.contact_inquiries
  for select using (public.is_admin());

drop policy if exists contact_inquiries_admin_update on public.contact_inquiries;
create policy contact_inquiries_admin_update on public.contact_inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- Kurumsal başvuru RPC
create or replace function public.submit_corporate_application(
  p_company_name text,
  p_contact_name text,
  p_email text,
  p_phone text default '',
  p_data jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if coalesce(trim(p_company_name), '') = '' or coalesce(trim(p_contact_name), '') = '' or coalesce(trim(p_email), '') = '' then
    raise exception 'Şirket adı, yetkili adı ve e-posta gerekli';
  end if;
  insert into public.corporate_applications (company_name, contact_name, email, phone, data)
  values (trim(p_company_name), trim(p_contact_name), lower(trim(p_email)), coalesce(p_phone, ''), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_corporate_application(text, text, text, text, jsonb) from public;
grant execute on function public.submit_corporate_application(text, text, text, text, jsonb) to anon, authenticated;

-- İletişim formu RPC
create or replace function public.submit_contact_inquiry(
  p_name text,
  p_email text,
  p_phone text default '',
  p_subject text default 'general',
  p_message text default '',
  p_source text default 'landing'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_email), '') = '' or length(trim(coalesce(p_message, ''))) < 10 then
    raise exception 'Ad, e-posta ve mesaj gerekli';
  end if;
  insert into public.contact_inquiries (name, email, phone, subject, message, source)
  values (trim(p_name), lower(trim(p_email)), coalesce(p_phone, ''), coalesce(p_subject, 'general'), trim(p_message), coalesce(p_source, 'landing'))
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_contact_inquiry(text, text, text, text, text, text) from public;
grant execute on function public.submit_contact_inquiry(text, text, text, text, text, text) to anon, authenticated;

-- Kullanılmayan custom_foods tablosu (kalori chat artık kullanmıyor)
drop table if exists public.custom_foods cascade;
