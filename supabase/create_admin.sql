-- =====================================================================
--  Yeni Form — Admin kullanıcısını hazır oluştur
--  Supabase Dashboard > SQL Editor'a yapıştırıp ÇALIŞTIRIN.
--  (Önce supabase/setup.sql çalıştırılmış olmalı.)
--
--  Bu script:
--   1) auth.users içine ONAYLI admin kullanıcı ekler
--   2) auth.identities kaydı ekler
--   3) public.members satırını role = 'admin' yapar
--
--  Giriş e-postası: admin@yeniform.com
--  Şifre: aşağıda v_password — kurulumdan sonra /admin/account ile değiştirin.
--  Gerçek üretim şifresini bu dosyaya yazmayın.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'admin@yeniform.com';
  v_password text := 'ChangeMeAfterSetup1!';
  v_name     text := 'Yeni Form Admin';
  v_uid      uuid;
begin
  select id into v_uid from auth.users where lower(email) = lower(v_email);

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
  else
    update auth.users
    set encrypted_password = crypt(v_password, gen_salt('bf')),
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_uid;
  end if;

  insert into public.members (id, email, name, role)
  values (v_uid, v_email, v_name, 'admin')
  on conflict (id) do update set role = 'admin', email = excluded.email, name = excluded.name;
end $$;
