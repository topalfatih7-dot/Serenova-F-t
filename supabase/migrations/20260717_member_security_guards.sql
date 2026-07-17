-- Faz 1: Üyelik/atama alanlarını koru, payments yalnızca admin/service_role,
-- admin e-postası tek kaynak (platform_settings).

-- ── Admin e-posta ayarı ─────────────────────────────────────────────────────
create table if not exists public.platform_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_settings enable row level security;

drop policy if exists platform_settings_admin_all on public.platform_settings;
create policy platform_settings_admin_all on public.platform_settings
  for all
  using (public.is_admin())
  with check (public.is_admin());

insert into public.platform_settings (key, value)
values ('admin_email', 'admin@yeniform.com')
on conflict (key) do update
  set value = excluded.value,
      updated_at = now();

create or replace function public.get_admin_email()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select lower(coalesce(
    (select value from public.platform_settings where key = 'admin_email' limit 1),
    'admin@yeniform.com'
  ));
$$;

revoke all on function public.get_admin_email() from public;
grant execute on function public.get_admin_email() to authenticated, anon;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = public.get_admin_email(),
    false
  )
  or exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- ── Privileged member fields guard ──────────────────────────────────────────
create or replace function public.enforce_member_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  jwt_role text;
  privileged_keys text[] := array[
    'packageConfig',
    'activePackages',
    'premiumStartedAt',
    'premiumExpiresAt',
    'freeTrialExpiresAt',
    'supportSchedule',
    'assignedCoachId',
    'assignedDietitianId',
    'assignedDoctorId'
  ];
  k text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.jwt() ->> 'role'
  );

  if jwt_role = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if coalesce(new.membership, 'free') is distinct from 'free' then
      raise exception 'Yetkisiz: ücretli üyelik yalnızca ödeme sistemi veya admin tarafından açılır.';
    end if;
    if coalesce(new.role, 'member') is distinct from 'member' then
      raise exception 'Yetkisiz: rol alanı değiştirilemez.';
    end if;
    if new.assigned_coach_id is not null
       or new.assigned_dietitian_id is not null
       or new.assigned_doctor_id is not null then
      raise exception 'Yetkisiz: personel ataması yalnızca admin tarafından yapılır.';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.role is distinct from old.role then
    raise exception 'Yetkisiz: rol alanı değiştirilemez.';
  end if;

  if new.assigned_coach_id is distinct from old.assigned_coach_id
     or new.assigned_dietitian_id is distinct from old.assigned_dietitian_id
     or new.assigned_doctor_id is distinct from old.assigned_doctor_id then
    raise exception 'Yetkisiz: personel ataması yalnızca admin tarafından yapılır.';
  end if;

  if new.membership is distinct from old.membership then
    -- Üye yalnızca ücretsiz plana düşebilir (Stripe dışı downgrade)
    if new.membership is distinct from 'free' then
      raise exception 'Yetkisiz: ücretli üyelik yalnızca ödeme sistemi veya admin tarafından açılır.';
    end if;
    -- free downgrade: paket alanları istemciden temizlenebilir
    return new;
  end if;

  -- Aynı planda: status + paket data alanlarını kilitle
  new.membership_status := old.membership_status;
  new.data := coalesce(new.data, '{}'::jsonb);
  foreach k in array privileged_keys loop
    if old.data ? k then
      new.data := jsonb_set(new.data, array[k], coalesce(old.data -> k, 'null'::jsonb), true);
    elsif new.data ? k then
      new.data := new.data - k;
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists trg_enforce_member_privileged_fields on public.members;
create trigger trg_enforce_member_privileged_fields
  before insert or update on public.members
  for each row
  execute function public.enforce_member_privileged_fields();

-- INSERT: üye yalnızca free + member rolü ile satır açabilir
drop policy if exists members_insert on public.members;
create policy members_insert on public.members for insert with check (
  public.is_admin()
  or (
    id = (select auth.uid())
    and coalesce(membership, 'free') = 'free'
    and coalesce(role, 'member') = 'member'
  )
);

-- payments: üye sahte kayıt ekleyemesin (service_role RLS bypass)
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments for insert with check (public.is_admin());
