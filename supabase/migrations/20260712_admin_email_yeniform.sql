-- Admin e-posta: admin@serenova.fit → admin@yeniform.com
-- Şifre bu migration'da YOKTUR — Auth'ta ayrı güncellenir; kod/dokümanda tutulmaz.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') = 'admin@yeniform.com',
    false
  )
  or exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'admin'
  );
$$;

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

  if v_role = 'admin' or lower(coalesce(v_email, '')) in ('admin@yeniform.com', 'admin@serenova.fit') then
    raise exception 'Admin hesabı silinemez.';
  end if;

  delete from public.members where id = p_id;
  delete from auth.users where id = p_id;
end;
$$;

revoke all on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_delete_member(uuid) to authenticated;

-- Auth + members e-posta taşıma (mevcut admin)
do $$
declare
  v_old text := 'admin@serenova.fit';
  v_new text := 'admin@yeniform.com';
  v_uid uuid;
begin
  select id into v_uid from auth.users where lower(email) = v_old;
  if v_uid is null then
    select id into v_uid from auth.users where lower(email) = v_new;
  end if;

  if v_uid is not null then
    update auth.users
    set email = v_new,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = v_uid;

    update auth.identities
    set identity_data = coalesce(identity_data, '{}'::jsonb)
        || jsonb_build_object('email', v_new, 'email_verified', true, 'sub', v_uid::text),
        updated_at = now()
    where user_id = v_uid and provider = 'email';

    insert into public.members (id, email, name, role)
    values (v_uid, v_new, 'Yeni Form Admin', 'admin')
    on conflict (id) do update
      set email = excluded.email,
          role = 'admin',
          name = coalesce(nullif(public.members.name, ''), excluded.name);
  end if;
end $$;
