-- Kadro başvuruları (koç / diyetisyen)
create table if not exists public.staff_applications (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('coach', 'dietitian')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  email text not null,
  name text not null,
  phone text default '',
  data jsonb not null default '{}'::jsonb,
  admin_note text default '',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists staff_applications_status_idx on public.staff_applications (status, created_at desc);
create index if not exists staff_applications_email_idx on public.staff_applications (lower(email));

alter table public.staff_applications enable row level security;

drop policy if exists staff_applications_insert on public.staff_applications;
create policy staff_applications_insert on public.staff_applications
  for insert with check (true);

drop policy if exists staff_applications_admin_select on public.staff_applications;
create policy staff_applications_admin_select on public.staff_applications
  for select using (public.is_admin());

drop policy if exists staff_applications_admin_update on public.staff_applications;
create policy staff_applications_admin_update on public.staff_applications
  for update using (public.is_admin()) with check (public.is_admin());

-- Başvuru gönder (herkese açık RPC — doğrudan tablo insert yerine)
create or replace function public.submit_staff_application(
  p_role text,
  p_email text,
  p_name text,
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
  v_role text;
begin
  v_role := lower(trim(coalesce(p_role, '')));
  if v_role not in ('coach', 'dietitian') then
    raise exception 'Geçersiz rol';
  end if;
  if coalesce(trim(p_email), '') = '' or coalesce(trim(p_name), '') = '' then
    raise exception 'Ad ve e-posta gerekli';
  end if;
  if exists (
    select 1 from public.staff_applications
    where lower(email) = lower(trim(p_email)) and status = 'pending'
  ) then
    raise exception 'Bu e-posta ile bekleyen bir başvuru zaten var';
  end if;
  if exists (
    select 1 from public.staff where lower(email) = lower(trim(p_email))
  ) then
    raise exception 'Bu e-posta kadromuzda kayıtlı';
  end if;

  insert into public.staff_applications (role, email, name, phone, data)
  values (v_role, lower(trim(p_email)), trim(p_name), coalesce(p_phone, ''), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_staff_application(text, text, text, text, jsonb) from public;
grant execute on function public.submit_staff_application(text, text, text, text, jsonb) to anon, authenticated;
