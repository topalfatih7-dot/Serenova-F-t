-- Doktor rolü + staff kaydının auth.users ile aynı id'ye bağlanması
-- Supabase SQL Editor'da çalıştırın.

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check
  check (role in ('coach', 'dietitian', 'doctor'));

-- admin_upsert_staff: yeni personelde staff.id = auth.users.id
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
  v_role      text := case
    when p_role in ('coach', 'dietitian', 'doctor') then p_role
    else 'coach'
  end;
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
      set id = excluded.id,
          name = excluded.name,
          role = excluded.role,
          active = excluded.active,
          data = excluded.data
    returning id into v_staff_id;
  end if;

  return v_staff_id;
end $$;
