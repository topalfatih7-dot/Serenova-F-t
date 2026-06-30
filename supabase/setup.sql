-- =====================================================================
--  YENİ FORM — TERTEMİZ KURULUM (TEK DOSYA)
--  ---------------------------------------------------------------------
--  Supabase Dashboard > SQL Editor'a bu dosyanın TAMAMINI yapıştırıp
--  bir kez çalıştırın. İdempotenttir; tekrar çalıştırmak güvenlidir.
--
--  İçerir:
--    1) Eklentiler + yardımcı fonksiyonlar (is_admin, is_staff, current_email)
--    2) Tüm tablolar (members, staff, programs, posts, tickets, activities,
--       payments, site_content, exercises, plans,
--       staff_applications, corporate_applications, contact_inquiries)
--    3) Yeni kullanıcı tetikleyicisi (auth.users -> members)
--    4) RLS politikaları
--    5) Admin + başvuru RPC'leri (admin_upsert_staff, admin_delete_staff,
--       submit_staff_application, submit_corporate_application, submit_contact_inquiry)
--    6) Depolama (exercise-videos bucket) politikaları
--    7) Varsayılan paketler (plans)
--    8) Onaylı admin kullanıcısı
--
--  NOT: Üyeye ait tüm detaylar (sağlık testi dahil) members.data JSONB
--  içinde tutulur — yeni/detaylı sağlık testi için ek tablo gerekmez.
--
--  members.data önemli anahtarlar:
--    healthTest      — kayıt/HealthTestWidget sağlık testi cevapları (JSONB)
--    healthAnalysis  — aiAnalysis.generateHealthAnalysis() çıktısı (VKİ, kalori,
--                      coachRecommendations.exercises[], dietitianRecommendations.mealPlan[])
--    goals, nutritionPrefs, fitnessLevel, weight, height, age, calorieHistory, …
--
--  posts.data önemli anahtarlar:
--    title, category, excerpt, author, readMinutes, accent, content,
--    coverImage, coverImageAlt  — blog kapak görseli (kategori bazlı Unsplash URL)
--    createdAt, updatedAt
--
--  Admin girişi:  admin@serenova.fit  /  Serenova2026!
--  (Değiştirirseniz aşağıdaki is_admin(), handle_new_user() ve en alttaki
--   admin bloğundaki e-postayı; ayrıca src/config/brand.js dosyasını güncelleyin.)
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1) YARDIMCI FONKSİYONLAR
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean language sql stable
security definer
set search_path = public, pg_temp as $$
  select coalesce(
    (auth.jwt() ->> 'email') = 'admin@serenova.fit',
    false
  )
  or exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'admin'
  );
$$;

create or replace function public.current_email()
returns text language sql stable
set search_path = public, pg_temp as $$
  select auth.jwt() ->> 'email';
$$;

-- is_staff: aşağıda staff tablosu oluşturulduktan sonra tanımlanır.

-- ---------------------------------------------------------------------
-- 2) TABLOLAR
-- ---------------------------------------------------------------------

-- Üyeler (auth.users ile 1:1). Tüm detay (sağlık testi dahil) data JSONB içinde.
create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  phone text not null default '',
  role text not null default 'member',
  membership text not null default 'free',
  membership_status text not null default 'active',
  assigned_coach_id uuid,
  assigned_dietitian_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.members add column if not exists phone text not null default '';

-- Kadro / uzman ekibi (koç, diyetisyen, doktor)
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  name text not null,
  role text not null default 'coach',
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check
  check (role in ('coach', 'dietitian', 'doctor'));

-- Programlar (antrenman / beslenme planları)
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  staff_id uuid references public.staff(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Blog yazıları (içerik + kapak görseli posts.data JSONB içinde)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  published boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Destek talepleri
create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  status text not null default 'open',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Aktivite kayıtları
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Ödemeler
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Statik site içeriği: yorum / SSS / başarı hikâyesi
create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  sort integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Hareket / egzersiz kütüphanesi
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  category text default 'Genel',
  sport_type text default 'Fitness',
  body_part text default 'Tüm Vücut',
  video_url text default '',
  created_at timestamptz not null default now()
);

alter table public.exercises add column if not exists sport_type text default 'Fitness';
alter table public.exercises add column if not exists body_part text default 'Tüm Vücut';

-- Paketler (admin panelinden düzenlenebilir)
create table if not exists public.plans (
  id text primary key,
  name text not null,
  price integer not null default 0,
  period text not null default 'Aylık',
  is_active boolean not null default true,
  badge text,
  features jsonb not null default '[]'::jsonb,
  limits jsonb not null default '[]'::jsonb,
  pricing_tiers jsonb not null default '[]'::jsonb,
  color text default 'sage',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

-- Kurumsal wellness başvuruları
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

-- Landing / iletişim formları
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

-- ---------------------------------------------------------------------
-- 3) is_staff() — staff tablosu hazır olduktan sonra
-- ---------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean language sql stable
set search_path = public, pg_temp as $$
  select exists (select 1 from public.staff s where s.email = public.current_email());
$$;

create or replace function public.staff_manages_member(p_member_id uuid)
returns boolean language sql stable
security definer
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.members m
    join public.staff s on (s.id = m.assigned_coach_id or s.id = m.assigned_dietitian_id)
    where m.id = p_member_id and lower(s.email) = lower(public.current_email())
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

-- ---------------------------------------------------------------------
-- 4) YENİ KULLANICI TETİKLEYİCİSİ
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.members (id, email, name, role)
  values (
    new.id, new.email,
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

-- ---------------------------------------------------------------------
-- 5) RLS
-- ---------------------------------------------------------------------
alter table public.members             enable row level security;
alter table public.staff               enable row level security;
alter table public.programs            enable row level security;
alter table public.posts               enable row level security;
alter table public.tickets             enable row level security;
alter table public.activities          enable row level security;
alter table public.payments            enable row level security;
alter table public.site_content        enable row level security;
alter table public.exercises           enable row level security;
alter table public.plans               enable row level security;
alter table public.staff_applications  enable row level security;
alter table public.corporate_applications enable row level security;
alter table public.contact_inquiries   enable row level security;

-- members
drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (
  public.is_admin() or id = auth.uid()
  or exists (select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and s.email = public.current_email())
);
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert with check (id = auth.uid() or public.is_admin());
drop policy if exists members_update on public.members;
create policy members_update on public.members for update using (
  public.is_admin() or id = auth.uid()
  or exists (select 1 from public.staff s
    where (s.id = members.assigned_coach_id or s.id = members.assigned_dietitian_id)
      and s.email = public.current_email())
);

-- staff
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

-- programs — personel yalnızca atanmış danışanların programlarını görür/düzenler
drop policy if exists programs_select on public.programs;
create policy programs_select on public.programs for select using (
  public.is_admin()
  or member_id = auth.uid()
  or public.staff_manages_member(member_id)
);
drop policy if exists programs_write on public.programs;
create policy programs_write on public.programs for all using (
  public.is_admin() or public.staff_manages_member(member_id)
) with check (
  public.is_admin() or public.staff_manages_member(member_id)
);

-- posts
drop policy if exists posts_select on public.posts;
create policy posts_select on public.posts for select using (published or public.is_admin());
drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts for all using (public.is_admin()) with check (public.is_admin());

-- tickets
drop policy if exists tickets_select on public.tickets;
create policy tickets_select on public.tickets for select using (public.is_admin() or member_id = auth.uid());
drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets for insert with check (public.is_admin() or member_id = auth.uid());
drop policy if exists tickets_update on public.tickets;
create policy tickets_update on public.tickets for update using (public.is_admin() or member_id = auth.uid());

-- activities
drop policy if exists activities_select on public.activities;
create policy activities_select on public.activities for select using (public.is_admin());
drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities for insert with check (
  public.is_admin()
  or public.is_staff()
  or (member_id = auth.uid())
);

-- payments
drop policy if exists payments_select on public.payments;
create policy payments_select on public.payments for select using (public.is_admin() or member_id = auth.uid());
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert with check (public.is_admin() or member_id = auth.uid());

-- site_content
drop policy if exists site_content_select on public.site_content;
create policy site_content_select on public.site_content for select using (true);
drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists site_content_member_story on public.site_content;
create policy site_content_member_story on public.site_content for insert to authenticated with check (kind = 'success_story');

-- exercises
drop policy if exists exercises_select on public.exercises;
create policy exercises_select on public.exercises for select using (true);
drop policy if exists exercises_admin_write on public.exercises;
create policy exercises_admin_write on public.exercises for all using (public.is_admin()) with check (public.is_admin());

-- plans
drop policy if exists plans_select on public.plans;
create policy plans_select on public.plans for select using (true);
drop policy if exists plans_admin_write on public.plans;
create policy plans_admin_write on public.plans for all using (public.is_admin()) with check (public.is_admin());

-- staff_applications
drop policy if exists staff_applications_insert on public.staff_applications;
create policy staff_applications_insert on public.staff_applications
  for insert with check (false);
drop policy if exists staff_applications_admin_select on public.staff_applications;
create policy staff_applications_admin_select on public.staff_applications
  for select using (public.is_admin());
drop policy if exists staff_applications_admin_update on public.staff_applications;
create policy staff_applications_admin_update on public.staff_applications
  for update using (public.is_admin()) with check (public.is_admin());

-- corporate_applications
drop policy if exists corporate_applications_admin_select on public.corporate_applications;
create policy corporate_applications_admin_select on public.corporate_applications
  for select using (public.is_admin());
drop policy if exists corporate_applications_admin_update on public.corporate_applications;
create policy corporate_applications_admin_update on public.corporate_applications
  for update using (public.is_admin()) with check (public.is_admin());

-- contact_inquiries
drop policy if exists contact_inquiries_admin_select on public.contact_inquiries;
create policy contact_inquiries_admin_select on public.contact_inquiries
  for select using (public.is_admin());
drop policy if exists contact_inquiries_admin_update on public.contact_inquiries;
create policy contact_inquiries_admin_update on public.contact_inquiries
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------
-- 6) RPC'ler
-- ---------------------------------------------------------------------
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

-- Telefon numarası başka bir üyede kayıtlı mı? (kayıt sırasında çift numara engeli)
-- Numaralar sadece rakamlara indirgenip karşılaştırılır.
create or replace function public.phone_in_use(p_phone text)
returns boolean language sql security definer stable
set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.members m
    where regexp_replace(coalesce(m.phone, ''), '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
      and length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) >= 7
  );
$$;
revoke all on function public.phone_in_use(text) from public;
grant execute on function public.phone_in_use(text) to anon, authenticated;

create or replace function public.admin_upsert_staff(
  p_id uuid, p_email text, p_password text, p_name text,
  p_role text, p_active boolean, p_data jsonb
) returns uuid
language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_email     text := lower(trim(p_email));
  v_old_email text;
  v_uid       uuid;
  v_staff_id  uuid;
  v_role      text := case when p_role in ('coach','dietitian','doctor') then p_role else 'coach' end;
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

  select id into v_uid from auth.users where email = v_email;
  if v_uid is null and v_old_email is not null and lower(v_old_email) <> v_email then
    select id into v_uid from auth.users where email = lower(v_old_email);
  end if;

  if v_uid is null then
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
      jsonb_build_object('name', p_name, 'staff_role', v_role),
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
    update auth.users
      set email = v_email,
          email_confirmed_at = coalesce(email_confirmed_at, now()),
          encrypted_password = case when coalesce(p_password, '') <> '' then crypt(p_password, gen_salt('bf')) else encrypted_password end,
          raw_user_meta_data = jsonb_set(
            jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{name}', to_jsonb(p_name)),
            '{staff_role}', to_jsonb(v_role)
          ),
          updated_at = now()
      where id = v_uid;
    update auth.identities
      set identity_data = jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
          updated_at = now()
      where user_id = v_uid and provider = 'email';
  end if;

  -- Otomatik oluşan member satırını temizle (kadro üye listesinde görünmesin)
  delete from public.members where id = v_uid;

  if p_id is not null then
    update public.staff
      set email = v_email, name = p_name, role = v_role,
          active = coalesce(p_active, true), data = coalesce(p_data, '{}'::jsonb)
      where id = p_id
      returning id into v_staff_id;
  end if;

  if v_staff_id is null then
    insert into public.staff (id, email, name, role, active, data)
    values (v_uid, v_email, p_name, v_role, coalesce(p_active, true), coalesce(p_data, '{}'::jsonb))
    on conflict (email) do update
      set id = excluded.id, name = excluded.name, role = excluded.role,
          active = excluded.active, data = excluded.data
    returning id into v_staff_id;
  end if;

  return v_staff_id;
end $$;

grant execute on function public.admin_upsert_staff(uuid, text, text, text, text, boolean, jsonb) to authenticated;
revoke all on function public.admin_upsert_staff(uuid, text, text, text, text, boolean, jsonb) from public, anon;

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
    )
    - 'headline';

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
returns void language plpgsql security definer set search_path = public as $$
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
      delete from auth.users where id = v_uid;
    end if;
  end if;
end $$;

grant execute on function public.admin_delete_staff(uuid) to authenticated;
revoke all on function public.admin_delete_staff(uuid) from public, anon;

create or replace function public.admin_delete_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  v_role text;
  v_email text;
begin
  if not public.is_admin() then
    raise exception 'Yetkisiz işlem: yalnızca admin üye silebilir.';
  end if;

  select role, email into v_role, v_email
  from public.members
  where id = p_id;

  if v_role is null then
    raise exception 'Üye bulunamadı.';
  end if;

  if v_role = 'admin' or lower(coalesce(v_email, '')) = 'admin@serenova.fit' then
    raise exception 'Admin hesabı silinemez.';
  end if;

  delete from public.members where id = p_id;
  delete from auth.users where id = p_id;
end;
$$;

revoke all on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_delete_member(uuid) to authenticated;

-- handle_new_user tetikleyici fonksiyonu — RPC ile çağrılmasın
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 7) DEPOLAMA — egzersiz videoları için herkese açık bucket
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('exercise-videos', 'exercise-videos', true)
on conflict (id) do nothing;

drop policy if exists "exercise videos public read" on storage.objects;
create policy "exercise videos public read" on storage.objects for select using (
  bucket_id = 'exercise-videos' and (public.is_admin() or owner = auth.uid())
);
drop policy if exists "exercise videos admin insert" on storage.objects;
create policy "exercise videos admin insert" on storage.objects for insert with check (bucket_id = 'exercise-videos' and public.is_admin());
drop policy if exists "exercise videos admin update" on storage.objects;
create policy "exercise videos admin update" on storage.objects for update using (bucket_id = 'exercise-videos' and public.is_admin());
drop policy if exists "exercise videos admin delete" on storage.objects;
create policy "exercise videos admin delete" on storage.objects for delete using (bucket_id = 'exercise-videos' and public.is_admin());

-- Kadro başvuru belgeleri (sertifika scan/PDF)
insert into storage.buckets (id, name, public)
values ('staff-application-docs', 'staff-application-docs', true)
on conflict (id) do nothing;

drop policy if exists "staff app docs public read" on storage.objects;
create policy "staff app docs public read" on storage.objects for select using (bucket_id = 'staff-application-docs');
drop policy if exists "staff app docs anon insert" on storage.objects;
create policy "staff app docs anon insert" on storage.objects for insert with check (bucket_id = 'staff-application-docs');
drop policy if exists "staff app docs admin delete" on storage.objects;
create policy "staff app docs admin delete" on storage.objects for delete using (bucket_id = 'staff-application-docs' and public.is_admin());

-- ---------------------------------------------------------------------
-- 8) VARSAYILAN PAKETLER
-- ---------------------------------------------------------------------
insert into public.plans (id, name, price, period, is_active, badge, features, limits, pricing_tiers, color, sort_order) values
('free', 'Basic', 0, 'Süresiz', true, null,
 '[{"text":"YZ Profil & Vücut Analizi","included":true},{"text":"Kişiselleştirilmiş Koç Listesi","included":true},{"text":"Diyetisyen Beslenme Listesi","included":true},{"text":"Video Kütüphanesi (Temel)","included":true},{"text":"Topluluk Erişimi","included":true},{"text":"Birebir Koç Görüşmesi","included":false},{"text":"Diyetisyen Randevusu","included":false},{"text":"İlerleme Raporları","included":false},{"text":"Öncelikli Destek","included":false}]'::jsonb,
 '["Aylık 1 plan güncellemesi","Temel bildirimler","Standart destek"]'::jsonb, '[]'::jsonb, 'sage', 0),
('eko', 'Eko Paket', 1299, 'Aylık', true, null,
 '[{"text":"Manuel Kalori Hesaplama","included":true},{"text":"Diyet Programı Ayda 2 Kere","included":true},{"text":"Spor Programı Ayda 1 Kere","included":true},{"text":"Video Kütüphanesi (Sınırlı)","included":true},{"text":"İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Birebir Koç Görüşmesi","included":false},{"text":"Diyetisyen Randevusu","included":false},{"text":"Fotoğraflı Kalori Tespiti","included":false}]'::jsonb,
 '["Sınırlı video erişimi","Program güncellemeleri"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":1299},{"months":3,"label":"3 Aylık","price":2999},{"months":6,"label":"6 Aylık","price":3999}]'::jsonb,
 'sage', 1),
('diyet', 'Diyet Paketi', 2499, 'Aylık', true, null,
 '[{"text":"Doktor Tarafından Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Diyetisyen ile Online Görüşme","included":true},{"text":"Diyet Üyeye Özel Diyet Programı","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Sınırsız Destek","included":true},{"text":"Birebir Koç Görüşmesi","included":false}]'::jsonb,
 '["Ayda 2 diyetisyen görüşmesi","Kişisel diyet programı"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2499},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'emerald', 2),
('spor', 'Spor Paketi', 2499, 'Aylık', true, null,
 '[{"text":"Doktor Tarafından Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Koç ile Online Görüşme","included":true},{"text":"Spor Üyeye Özel Spor Programı","included":true},{"text":"Sınırsız Video Kütüphanesi Erişimi","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Sınırsız Destek","included":true}]'::jsonb,
 '["Ayda 2 koç görüşmesi","Kişisel spor programı"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2499},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'blue', 3),
('doktor', 'Doktor Paketi', 2500, 'Aylık', true, null,
 '[{"text":"Online Doktor Seansı","included":true}]'::jsonb,
 '["Online doktor görüşmesi"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2500},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'teal', 4),
('vip', 'Vip Paket', 4999, 'Aylık', true, 'VIP',
 '[{"text":"Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Diyetisyen ile Online Görüşme","included":true},{"text":"Vip Üyeye Özel Diyet Programı","included":true},{"text":"Ayda 2 Koç ile Online Görüşme","included":true},{"text":"Vip Üyeye Özel Spor Programı","included":true},{"text":"Sınırsız Video Kütüphanesi Erişimi","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Ücretsiz Takip Programı","included":true},{"text":"Sınırsız Destek","included":true},{"text":"Vip Üye Rozeti","included":true}]'::jsonb,
 '["Ayda 2 koç + 2 diyetisyen","Sınırsız destek"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":4999},{"months":3,"label":"3 Aylık","price":12999},{"months":6,"label":"6 Aylık","price":19999}]'::jsonb,
 'brand', 5)
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  period = excluded.period,
  is_active = excluded.is_active,
  badge = excluded.badge,
  features = excluded.features,
  limits = excluded.limits,
  pricing_tiers = excluded.pricing_tiers,
  color = excluded.color,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Eski planları pasif tut (geriye dönük üyeler korunur)
update public.plans set is_active = false where id in ('gumus', 'altin', 'platinum', 'kurucu');

-- ---------------------------------------------------------------------
-- 9) ONAYLI ADMIN KULLANICISI
-- ---------------------------------------------------------------------
do $$
declare
  v_email    text := 'admin@serenova.fit';
  v_password text := 'Serenova2026!';
  v_name     text := 'Yeni Form Admin';
  v_uid      uuid;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    v_uid := gen_random_uuid();
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_uid, 'authenticated', 'authenticated', v_email,
      crypt(v_password, gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', v_name),
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
  end if;
  insert into public.members (id, email, name, role)
  values (v_uid, v_email, v_name, 'admin')
  on conflict (id) do update set role = 'admin', name = excluded.name;
end $$;

-- ---------------------------------------------------------------------
-- 8) Anlık kullanıcı varlığı (presence) + çevrimiçi istatistik
-- ---------------------------------------------------------------------
create table if not exists public.user_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  role text not null default 'member',
  session_started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  page_path text
);
create index if not exists user_presence_last_seen_idx on public.user_presence(last_seen_at desc);

alter table public.user_presence enable row level security;

drop policy if exists user_presence_self on public.user_presence;
create policy user_presence_self on public.user_presence
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists user_presence_admin_select on public.user_presence;
create policy user_presence_admin_select on public.user_presence
  for select using (public.is_admin());

create or replace function public.get_online_stats()
returns json
language sql
security definer
set search_path = public
stable
as $$
  select json_build_object(
    'online_now', (
      select count(*)::int from public.user_presence
      where last_seen_at > now() - interval '90 seconds'
    ),
    'total_members', (select count(*)::int from public.members)
  );
$$;
revoke all on function public.get_online_stats() from public;
grant execute on function public.get_online_stats() to anon, authenticated;

create or replace function public.get_active_users()
returns json
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden';
  end if;
  return (
    select coalesce(json_agg(row_to_json(t)), '[]'::json)
    from (
      select user_id, email, name, role, session_started_at, last_seen_at, page_path,
        extract(epoch from (now() - session_started_at))::int as duration_seconds
      from public.user_presence
      where last_seen_at > now() - interval '90 seconds'
      order by session_started_at desc
    ) t
  );
end;
$$;
revoke all on function public.get_active_users() from public, anon;
grant execute on function public.get_active_users() to authenticated;

-- =====================================================================
--  BİTTİ. Temiz kurulum hazır.
--  • Admin:  admin@serenova.fit / Serenova2026!
--  • Kadro, blog, hareket kütüphanesi, içerik → admin panelinden eklenir.
--  • Sağlık testi cevapları members.data->'healthTest' içinde saklanır.
-- =====================================================================
