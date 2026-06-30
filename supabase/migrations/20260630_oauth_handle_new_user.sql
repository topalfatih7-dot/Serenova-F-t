-- OAuth kayıtlarında ad soyad metadata'dan daha güvenilir şekilde alınır.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(trim(concat(
      coalesce(new.raw_user_meta_data ->> 'given_name', ''),
      ' ',
      coalesce(new.raw_user_meta_data ->> 'family_name', '')
    )), '')
  );

  insert into public.members (id, email, name, role)
  values (
    new.id, new.email,
    coalesce(v_name, ''),
    case when new.email = 'admin@serenova.fit' then 'admin' else 'member' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
