-- Kayıt: istemci karmaşıklık kurallarını doğrula, GoTrue HIBP sızmış-şifre
-- kontrolünü atlayarak auth.users oluştur (bcrypt). Yalnızca service_role çağırır.

create extension if not exists pgcrypto;

create or replace function public.register_email_user(
  p_email text,
  p_password text,
  p_name text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_password text := coalesce(p_password, '');
  v_name text := trim(coalesce(p_name, ''));
  v_uid uuid;
begin
  if v_email is null or v_email = '' or position('@' in v_email) < 2 then
    return jsonb_build_object('ok', false, 'error', 'Geçerli bir e-posta adresi girin.');
  end if;

  if length(v_password) < 8
     or v_password !~ '[a-z]'
     or v_password !~ '[A-Z]'
     or v_password !~ '[0-9]'
     or v_password !~ '[^A-Za-z0-9]' then
    return jsonb_build_object(
      'ok', false,
      'error', 'Şifre en az 8 karakter olmalı; büyük harf, küçük harf, rakam ve özel karakter içermelidir.'
    );
  end if;

  select id into v_uid from auth.users where lower(email) = v_email;
  if v_uid is not null then
    return jsonb_build_object('ok', false, 'error', 'already_registered', 'user_id', v_uid);
  end if;

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
    jsonb_build_object('name', nullif(v_name, '')),
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

  return jsonb_build_object('ok', true, 'user_id', v_uid);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'already_registered');
  when others then
    return jsonb_build_object('ok', false, 'error', sqlerrm);
end;
$$;

revoke all on function public.register_email_user(text, text, text) from public, anon, authenticated;
grant execute on function public.register_email_user(text, text, text) to service_role;
