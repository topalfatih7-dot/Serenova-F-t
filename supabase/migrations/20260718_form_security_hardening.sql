-- Form bot/flood koruması + anon yüzey daraltma + storage sertleştirme
-- + success_story / ticket soft limit + exercise-thumbs listing

-- ---------------------------------------------------------------------
-- 1) Bilgi sızıntısı / gereksiz anon EXECUTE
-- ---------------------------------------------------------------------
revoke all on function public.get_admin_email() from public, anon;
grant execute on function public.get_admin_email() to authenticated, service_role;

revoke all on function public.append_member_notification(uuid, jsonb) from public, anon;
grant execute on function public.append_member_notification(uuid, jsonb) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- 2) submit_* — rate limit + max length; anon EXECUTE kaldır (yalnız service_role)
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
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_role text;
  v_email text;
begin
  v_role := lower(trim(coalesce(p_role, '')));
  v_email := lower(trim(coalesce(p_email, '')));

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

  insert into public.staff_applications (role, email, name, phone, data)
  values (v_role, v_email, trim(p_name), coalesce(p_phone, ''), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;

  return v_id;
end;
$$;

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
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text;
begin
  v_email := lower(trim(coalesce(p_email, '')));
  if coalesce(trim(p_company_name), '') = ''
     or coalesce(trim(p_contact_name), '') = ''
     or v_email = ''
     or position('@' in v_email) = 0 then
    raise exception 'Şirket adı, yetkili adı ve e-posta gerekli';
  end if;
  if length(trim(p_company_name)) > 200 or length(trim(p_contact_name)) > 120 then
    raise exception 'Alan uzunluğu aşıldı';
  end if;
  if length(coalesce(p_data::text, '')) > 50000 then
    raise exception 'Başvuru verisi çok büyük';
  end if;

  if (
    select count(*)::int from public.corporate_applications
    where lower(email) = v_email and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Bu e-posta ile çok fazla başvuru gönderildi. Lütfen sonra deneyin.';
  end if;

  if (
    select count(*)::int from public.corporate_applications
    where created_at > now() - interval '1 hour'
  ) >= 80 then
    raise exception 'Sistem meşgul. Lütfen sonra tekrar deneyin.';
  end if;

  insert into public.corporate_applications (company_name, contact_name, email, phone, data)
  values (trim(p_company_name), trim(p_contact_name), v_email, coalesce(p_phone, ''), coalesce(p_data, '{}'::jsonb))
  returning id into v_id;
  return v_id;
end;
$$;

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
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_email text;
  v_msg text;
begin
  v_email := lower(trim(coalesce(p_email, '')));
  v_msg := trim(coalesce(p_message, ''));

  if coalesce(trim(p_name), '') = '' or v_email = '' or position('@' in v_email) = 0 or length(v_msg) < 10 then
    raise exception 'Ad, e-posta ve mesaj gerekli';
  end if;
  if length(trim(p_name)) > 120 then
    raise exception 'Ad çok uzun';
  end if;
  if length(v_msg) > 2000 then
    raise exception 'Mesaj en fazla 2000 karakter olabilir';
  end if;

  if (
    select count(*)::int from public.contact_inquiries
    where lower(email) = v_email and created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Bu e-posta ile çok fazla mesaj gönderildi. Lütfen sonra deneyin.';
  end if;

  if (
    select count(*)::int from public.contact_inquiries
    where created_at > now() - interval '1 hour'
  ) >= 100 then
    raise exception 'Sistem meşgul. Lütfen sonra tekrar deneyin.';
  end if;

  insert into public.contact_inquiries (name, email, phone, subject, message, source)
  values (
    trim(p_name),
    v_email,
    coalesce(p_phone, ''),
    coalesce(nullif(trim(p_subject), ''), 'general'),
    v_msg,
    coalesce(nullif(trim(p_source), ''), 'landing')
  )
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.submit_staff_application(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_staff_application(text, text, text, text, jsonb) to service_role;

revoke all on function public.submit_corporate_application(text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.submit_corporate_application(text, text, text, text, jsonb) to service_role;

revoke all on function public.submit_contact_inquiry(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_contact_inquiry(text, text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- 3) Storage: staff-application-docs — anon INSERT kapat
-- ---------------------------------------------------------------------
drop policy if exists "staff app docs anon insert" on storage.objects;
-- Yazma yalnızca service_role (API); ayrı INSERT policy yok.

-- ---------------------------------------------------------------------
-- 4) exercise-thumbs: public listing kapat (public URL GET etkilenmez)
-- ---------------------------------------------------------------------
drop policy if exists "exercise thumbs public read" on storage.objects;

-- ---------------------------------------------------------------------
-- 5) Success story soft limit — üye başına günde 3
-- ---------------------------------------------------------------------
create or replace function public.enforce_success_story_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.kind = 'success_story' and auth.uid() is not null and not public.is_admin() then
    if (
      select count(*)::int from public.site_content sc
      where sc.kind = 'success_story'
        and sc.created_at > now() - interval '24 hours'
        and (
          (sc.data->>'memberId') = auth.uid()::text
          or (sc.data->>'member_id') = auth.uid()::text
        )
    ) >= 3 then
      raise exception 'Günlük başarı hikâyesi limitine ulaştınız (3/gün).';
    end if;
    new.data := coalesce(new.data, '{}'::jsonb) || jsonb_build_object('memberId', auth.uid()::text);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_success_story_rate_limit on public.site_content;
create trigger trg_success_story_rate_limit
  before insert on public.site_content
  for each row
  execute function public.enforce_success_story_rate_limit();

-- ---------------------------------------------------------------------
-- 6) Ticket soft limit — üye başına günde 10
-- ---------------------------------------------------------------------
create or replace function public.enforce_ticket_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.member_id is not null and not public.is_admin() then
    if (
      select count(*)::int from public.tickets t
      where t.member_id = new.member_id
        and t.created_at > now() - interval '24 hours'
    ) >= 10 then
      raise exception 'Günlük destek talebi limitine ulaştınız (10/gün).';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_ticket_rate_limit on public.tickets;
create trigger trg_ticket_rate_limit
  before insert on public.tickets
  for each row
  execute function public.enforce_ticket_rate_limit();
