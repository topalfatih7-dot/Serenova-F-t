-- =====================================================================
--  Yeni Form — Admin kullanıcısını hazır oluştur
--  Supabase Dashboard > SQL Editor'a yapıştırıp ÇALIŞTIRIN.
--  (Önce schema.sql çalıştırılmış olmalı.)
--
--  Bu script:
--   1) auth.users içine ONAYLI (email_confirmed) bir admin kullanıcı ekler,
--      böylece e-posta doğrulaması açık olsa bile hemen giriş yapılır.
--   2) auth.identities içine eşleşen kaydı ekler (şifreyle giriş için gerekli).
--   3) public.members tablosunda admin satırını garanti eder (role = 'admin').
--
--  Giriş bilgileri (login sayfasında kullan):
--     E-posta : admin@serenova.fit
--     Şifre   : Serenova2026!
--
--  Not: E-posta/şifreyi değiştirmek istersen aşağıdaki iki değişkeni güncelle.
--       E-postayı değiştirirsen schema.sql'deki is_admin() ve handle_new_user()
--       fonksiyonlarındaki adresi de aynı yapmalısın.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'admin@serenova.fit';
  v_password text := 'Serenova2026!';
  v_name     text := 'Yeni Form Admin';
  v_uid      uuid;
begin
  -- Zaten varsa tekrar oluşturma; sadece admin rolünü garanti et.
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

  -- members tablosunda admin satırını garanti et
  insert into public.members (id, email, name, role)
  values (v_uid, v_email, v_name, 'admin')
  on conflict (id) do update set role = 'admin', name = excluded.name;
end $$;

-- Kontrol: admin satırını göster
select id, email, role from public.members where role = 'admin';
