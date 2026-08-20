-- Kadro başvurusu: profil fotoğrafı (storage URL) zorunlu

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
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_role text;
  v_email text;
  v_photo text;
begin
  v_role := lower(trim(coalesce(p_role, '')));
  v_email := lower(trim(coalesce(p_email, '')));
  v_photo := trim(coalesce(p_data->>'photo', ''));

  if v_role not in ('coach', 'dietitian') then
    raise exception 'Geçersiz rol';
  end if;
  if coalesce(trim(p_name), '') = '' or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'Ad ve e-posta gerekli';
  end if;
  if length(trim(p_name)) > 120 then
    raise exception 'Ad çok uzun';
  end if;
  if length(coalesce(p_data::text, '')) > 100000 then
    raise exception 'Başvuru verisi çok büyük';
  end if;
  if v_photo = '' or left(v_photo, 5) = 'data:' or v_photo not like 'http%' then
    raise exception 'Profil fotoğrafı gerekli';
  end if;

  if (
    select count(*)::int from public.staff_applications
    where lower(email) = v_email and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Bu e-posta ile çok fazla başvuru gönderildi. Lütfen sonra deneyin.';
  end if;

  if (
    select count(*)::int from public.staff_applications
    where created_at > now() - interval '1 hour'
  ) >= 80 then
    raise exception 'Sistem meşgul. Lütfen sonra tekrar deneyin.';
  end if;

  if exists (
    select 1 from public.staff_applications
    where lower(email) = v_email and status = 'pending'
  ) then
    raise exception 'Bu e-posta ile bekleyen bir başvuru zaten var';
  end if;
  if exists (
    select 1 from public.staff where lower(email) = v_email
  ) then
    raise exception 'Bu e-posta kadromuzda kayıtlı';
  end if;
  if exists (
    select 1 from auth.users where lower(email) = v_email
  ) then
    raise exception 'Bu e-posta adresi mevcut bir hesaba ait. Lütfen farklı bir e-posta kullanın.';
  end if;

  insert into public.staff_applications (role, email, name, phone, data)
  values (v_role, v_email, trim(p_name), coalesce(p_phone, ''), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.submit_staff_application(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_staff_application(text, text, text, text, jsonb) to service_role;
