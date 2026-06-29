-- =====================================================================
--  Yeni Form — Supabase Şeması
--  Supabase Dashboard > SQL Editor'a yapıştırıp çalıştırın.
--  Mimari: JSONB tabanlı (mevcut uygulama veri yapısıyla birebir uyumlu).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) Admin tanımı
--    Admin, aşağıdaki e-posta ile Supabase'e kayıt olan kullanıcıdır.
--    Kendi admin e-postanızı kullanacaksanız bu fonksiyondaki adresi
--    değiştirin (uygulamadaki src/config/brand.js ile aynı olmalı).
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') = 'admin@serenova.fit', false);
$$;

-- Giriş yapan kullanıcının e-postası
create or replace function public.current_email()
returns text
language sql
stable
as $$
  select auth.jwt() ->> 'email';
$$;

-- =====================================================================
--  TABLOLAR
-- =====================================================================

-- Üyeler (auth.users ile 1:1). Üyeye ait tüm detay "data" JSONB içinde.
create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  role text not null default 'member',
  membership text not null default 'free',
  membership_status text not null default 'active',
  assigned_coach_id uuid,
  assigned_dietitian_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Kadro / uzman ekibi (admin tarafından yönetilir, anasayfada herkese açık)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text not null,
  role text not null check (role in ('coach', 'dietitian')),
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Programlar (antrenman / beslenme planları)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Blog yazıları
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  published boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Destek talepleri
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  status text not null default 'open',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Aktivite kayıtları (admin akışı)
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Ödemeler
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Statik site içeriği: yorumlar, SSS, başarı hikâyeleri (herkese açık)
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null,            -- 'testimonial' | 'faq' | 'success_story'
  sort integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Hareket / egzersiz kütüphanesi (admin doldurur; üye, koç, diyetisyen görür)
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category text default 'Genel',
  video_url text default '',
  created_at timestamptz not null default now()
);

-- Üyelik talepleri (tatil dondurma / iptal / yeniden başlatma) — admin onayı gerekir
create table if not exists public.membership_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  member_name text default '',
  type text not null check (type in ('freeze', 'cancel', 'resume', 'renew')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_until date,
  note text default '',
  created_at timestamptz not null default now()
);

-- =====================================================================
--  YENİ KULLANICI TETİKLEYİCİSİ
--  Supabase Auth'a kayıt olunca members tablosuna otomatik satır açar.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.members (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    case when new.email = 'admin@serenova.fit' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
--  RLS (Row Level Security)
-- =====================================================================
alter table public.members      enable row level security;
alter table public.staff        enable row level security;
alter table public.programs     enable row level security;
alter table public.posts        enable row level security;
alter table public.tickets      enable row level security;
alter table public.activities   enable row level security;
alter table public.payments     enable row level security;
alter table public.site_content enable row level security;
alter table public.exercises    enable row level security;
alter table public.membership_requests enable row level security;

-- Giriş yapan kullanıcı bir uzman mı? (e-posta eşleşmesiyle)
create or replace function public.is_staff()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.staff s where lower(s.email) = lower(public.current_email())
  );
$$;

create or replace function public.current_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select s.id from public.staff s
  where lower(s.email) = lower(public.current_email())
  limit 1;
$$;

revoke all on function public.current_staff_id() from public;
grant execute on function public.current_staff_id() to authenticated;

-- ---- members ----
drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (
  public.is_admin()
  or id = auth.uid()
  or exists (
    select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and s.email = public.current_email()
  )
);

drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert with check (
  id = auth.uid() or public.is_admin()
);

drop policy if exists members_update on public.members;
create policy members_update on public.members for update using (
  public.is_admin()
  or id = auth.uid()
  or exists (
    select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and s.email = public.current_email()
  )
);

-- ---- staff (herkese açık okuma, admin yönetir, uzman kendini günceller) ----
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select using (true);

drop policy if exists staff_admin_write on public.staff;
create policy staff_admin_write on public.staff for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists staff_self_update on public.staff;
create policy staff_self_update on public.staff for update
  using (lower(email) = lower(public.current_email()))
  with check (
    lower(email) = lower(public.current_email())
    and id = public.current_staff_id()
  );

-- ---- programs ----
drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select using (
  public.is_admin() or member_id = auth.uid() or public.is_staff()
);

drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs for all using (
  public.is_admin() or public.is_staff()
) with check (
  public.is_admin() or public.is_staff()
);

-- ---- posts (yayınlananları herkes görür) ----
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (published or public.is_admin());

drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts for all using (public.is_admin()) with check (public.is_admin());

-- ---- tickets ----
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets for select using (
  public.is_admin() or member_id = auth.uid()
);

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert with check (
  public.is_admin() or member_id = auth.uid()
);

drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets for update using (
  public.is_admin() or member_id = auth.uid()
);

-- ---- activities (admin görür; giriş yapan herkes oluşturabilir) ----
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities for select using (public.is_admin());

drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities for insert with check (auth.uid() is not null);

-- ---- payments ----
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (
  public.is_admin() or member_id = auth.uid()
);

drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert with check (
  public.is_admin() or member_id = auth.uid()
);

-- ---- site_content (herkese açık okuma, admin yönetir) ----
drop policy if exists site_content_select on public.site_content;
create policy site_content_select on public.site_content for select using (true);

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content for all using (public.is_admin()) with check (public.is_admin());

-- Üyeler kendi başarı hikâyelerini gönderebilir (onay bekler)
drop policy if exists site_content_member_story on public.site_content;
create policy site_content_member_story on public.site_content for insert to authenticated
  with check (kind = 'success_story');

-- ---- exercises (herkese açık okuma, admin yönetir) ----
drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises for select using (true);

drop policy if exists exercises_admin_write on public.exercises;
create policy exercises_admin_write on public.exercises for all using (public.is_admin()) with check (public.is_admin());

-- ---- membership_requests ----
drop policy if exists requests_select on public.membership_requests;
create policy requests_select on public.membership_requests for select using (
  public.is_admin() or member_id = auth.uid()
);

drop policy if exists requests_insert on public.membership_requests;
create policy requests_insert on public.membership_requests for insert with check (
  member_id = auth.uid()
);

drop policy if exists requests_update on public.membership_requests;
create policy requests_update on public.membership_requests for update using (public.is_admin());

-- =====================================================================
--  ADMIN RPC: Kadro (koç/diyetisyen) oluşturma & güncelleme
--  Personel girişinin çalışması için auth.users kaydı da oluşturulur.
--  (security definer; yalnızca admin çağırabilir)
-- =====================================================================
create extension if not exists pgcrypto;

create or replace function public.admin_upsert_staff(
  p_id uuid,
  p_email text,
  p_password text,
  p_name text,
  p_role text,
  p_active boolean,
  p_data jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, extensions, auth
as $$
declare
  v_email     text := lower(trim(p_email));
  v_old_email text;
  v_uid       uuid;
  v_staff_id  uuid;
begin
  if not public.is_admin() then
    raise exception 'Yetkisiz işlem: yalnızca admin personel ekleyebilir.';
  end if;
  if v_email is null or v_email = '' then
    raise exception 'E-posta gerekli.';
  end if;

  if p_id is not null then
    select email into v_old_email from public.staff where id = p_id;
  end if;

  -- Auth kullanıcısını bul (yeni e-posta, yoksa eski e-posta ile)
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null and v_old_email is not null and lower(v_old_email) <> v_email then
    select id into v_uid from auth.users where email = lower(v_old_email);
  end if;

  if v_uid is null then
    -- Yeni onaylı auth kullanıcısı oluştur
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated', v_email,
      crypt(coalesce(nullif(p_password, ''), 'Gecici1234!'), gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', p_name),
      '', '', '', ''
    );
    insert into auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(), v_uid, v_uid::text,
      jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
      'email', now(), now(), now()
    );
  else
    -- Var olan kullanıcıyı güncelle (e-posta her zaman, şifre verildiyse)
    update auth.users
      set email = v_email,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          encrypted_password = case when coalesce(p_password, '') <> '' then crypt(p_password, gen_salt('bf')) else encrypted_password end,
          raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{name}', to_jsonb(p_name)),
          updated_at = now()
      where id = v_uid;
    update auth.identities
      set identity_data = jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
          updated_at = now()
      where user_id = v_uid and provider = 'email';
  end if;

  -- Otomatik oluşan member satırını temizle (kadro üye listesinde görünmesin)
  delete from public.members where id = v_uid;

  -- staff satırını ekle/güncelle
  if p_id is not null then
    update public.staff
      set email = v_email, name = p_name, role = p_role,
          active = coalesce(p_active, true), data = coalesce(p_data, '{}'::jsonb)
      where id = p_id
      returning id into v_staff_id;
  end if;

  if v_staff_id is null then
    insert into public.staff (email, name, role, active, data)
    values (v_email, p_name, p_role, coalesce(p_active, true), coalesce(p_data, '{}'::jsonb))
    on conflict (email) do update
      set name = excluded.name, role = excluded.role, active = excluded.active, data = excluded.data
    returning id into v_staff_id;
  end if;

  return v_staff_id;
end $$;

grant execute on function public.admin_upsert_staff(uuid, text, text, text, text, boolean, jsonb) to authenticated;

create or replace function public.staff_update_self_profile(
  p_name text,
  p_data jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := public.current_staff_id();
  v_current jsonb;
  v_merged jsonb;
begin
  if v_id is null then
    raise exception 'Yetkisiz: personel oturumu gerekli.';
  end if;

  select coalesce(data, '{}'::jsonb) into v_current
  from public.staff
  where id = v_id;

  v_merged := coalesce(v_current, '{}'::jsonb)
    || coalesce(p_data, '{}'::jsonb)
    || jsonb_build_object(
      'specialty', v_current->'specialty',
      'specialties', coalesce(v_current->'specialties', '[]'::jsonb),
      'experienceYears', coalesce(v_current->'experienceYears', to_jsonb(0)),
      'languages', coalesce(v_current->'languages', '["Türkçe"]'::jsonb),
      'education', coalesce(v_current->'education', '[]'::jsonb),
      'experiences', coalesce(v_current->'experiences', '[]'::jsonb),
      'certificates', coalesce(v_current->'certificates', '[]'::jsonb)
    );

  update public.staff
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    data = v_merged
  where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.staff_update_self_profile(text, jsonb) from public, anon;
grant execute on function public.staff_update_self_profile(text, jsonb) to authenticated;

create or replace function public.admin_delete_staff(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_uid   uuid;
begin
  if not public.is_admin() then
    raise exception 'Yetkisiz işlem.';
  end if;
  select email into v_email from public.staff where id = p_id;
  delete from public.staff where id = p_id;
  if v_email is not null then
    select id into v_uid from auth.users where email = lower(v_email);
    if v_uid is not null then
      delete from auth.users where id = v_uid; -- identities cascade ile silinir
    end if;
  end if;
end $$;

grant execute on function public.admin_delete_staff(uuid) to authenticated;

-- =====================================================================
--  STORAGE: egzersiz videoları için herkese açık bucket
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('exercise-videos', 'exercise-videos', true)
on conflict (id) do nothing;

drop policy if exists "exercise videos public read" on storage.objects;
create policy "exercise videos public read" on storage.objects
  for select using (bucket_id = 'exercise-videos');

drop policy if exists "exercise videos admin insert" on storage.objects;
create policy "exercise videos admin insert" on storage.objects
  for insert with check (bucket_id = 'exercise-videos' and public.is_admin());

drop policy if exists "exercise videos admin update" on storage.objects;
create policy "exercise videos admin update" on storage.objects
  for update using (bucket_id = 'exercise-videos' and public.is_admin());

drop policy if exists "exercise videos admin delete" on storage.objects;
create policy "exercise videos admin delete" on storage.objects
  for delete using (bucket_id = 'exercise-videos' and public.is_admin());

-- =====================================================================
--  Bittikten sonra: supabase/seed.sql dosyasını çalıştırın.
-- =====================================================================
