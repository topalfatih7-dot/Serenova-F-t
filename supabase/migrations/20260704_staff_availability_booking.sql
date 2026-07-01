-- Madde 1: Self-servis randevu — personel müsaitliğinden slot üretimi + çakışmasız booking
--
-- staff.data.availability = { "1": ["09:00","10:00", ...], ... }
--   anahtar = haftanın günü (0=Pazar .. 6=Cumartesi; JS getDay / postgres dow ile aynı)
--   değer   = o gün müsait SAAT başlangıçları (saatlik). Slotlar 30 dk'lık olarak üretilir:
--             "09:00" müsaitse 09:00 ve 09:30 slotları açılır.
--
-- Randevular mevcut yapıya yazılır: members.data.{coachSessions,dietitianSessions,doctorSessions}
-- Üye yalnızca kendi satırını okuyabildiği için çakışma kontrolü SECURITY DEFINER RPC ile yapılır.

-- Bir personelin verilen tür + tarih aralığındaki DOLU başlangıç saatlerini döndürür (kimlik sızdırmaz).
create or replace function public.staff_booked_slots(
  p_staff_id uuid,
  p_type text,
  p_from timestamptz,
  p_to timestamptz
) returns setof timestamptz
language sql
security definer
set search_path = public, pg_temp
as $$
  select (s->>'date')::timestamptz
  from public.members m
  cross join lateral jsonb_array_elements(
    coalesce(
      m.data -> (case lower(p_type)
        when 'coach' then 'coachSessions'
        when 'doctor' then 'doctorSessions'
        else 'dietitianSessions' end),
      '[]'::jsonb)
  ) as s
  where (
    (lower(p_type) = 'coach'
      and (m.assigned_coach_id = p_staff_id or m.data->>'assignedCoachId' = p_staff_id::text))
    or (lower(p_type) = 'dietitian'
      and (m.assigned_dietitian_id = p_staff_id or m.data->>'assignedDietitianId' = p_staff_id::text))
    or (lower(p_type) = 'doctor'
      and m.data->>'assignedDoctorId' = p_staff_id::text)
  )
  and coalesce(s->>'status', 'scheduled') in ('scheduled', 'rescheduled')
  and (s->>'date') is not null
  and (s->>'date') ~ '^\d{4}-\d{2}-\d{2}T'
  and (s->>'date')::timestamptz >= p_from
  and (s->>'date')::timestamptz < p_to;
$$;

revoke all on function public.staff_booked_slots(uuid, text, timestamptz, timestamptz) from public, anon;
grant execute on function public.staff_booked_slots(uuid, text, timestamptz, timestamptz) to authenticated;

-- Çağıran üye için çakışmasız randevu oluşturur.
create or replace function public.book_staff_session(
  p_type text,
  p_starts_at timestamptz,
  p_duration int default 30
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_type text := lower(p_type);
  v_key text;
  v_data jsonb;
  v_pkg jsonb;
  v_staff_id uuid;
  v_staff_data jsonb;
  v_staff_name text;
  v_avail jsonb;
  v_dow int;
  v_hour text;
  v_limit int := 0;
  v_used int := 0;
  v_taken int := 0;
  v_session jsonb;
  v_sessions jsonb;
  v_title text;
begin
  if v_uid is null then raise exception 'Yetkisiz: oturum gerekli.'; end if;
  if v_type not in ('coach', 'dietitian', 'doctor') then
    raise exception 'Geçersiz randevu türü.';
  end if;
  if p_starts_at <= now() then raise exception 'Geçmiş bir zaman seçilemez.'; end if;

  select coalesce(data, '{}'::jsonb) into v_data from public.members where id = v_uid;
  if v_data is null then raise exception 'Üye kaydı bulunamadı.'; end if;
  v_pkg := coalesce(v_data->'packageConfig', '{}'::jsonb);

  if v_type = 'coach' then
    v_key := 'coachSessions';
    select assigned_coach_id into v_staff_id from public.members where id = v_uid;
    if v_staff_id is null then v_staff_id := nullif(v_data->>'assignedCoachId', '')::uuid; end if;
    v_limit := coalesce(nullif(v_pkg->>'coachMeetingsPerMonth', '')::int, 0);
    if v_limit = 0 then v_limit := coalesce(nullif(v_pkg->>'coachMeetingsPerWeek', '')::int, 0) * 4; end if;
    v_title := 'Koç Görüşmesi';
  elsif v_type = 'doctor' then
    v_key := 'doctorSessions';
    v_staff_id := nullif(v_data->>'assignedDoctorId', '')::uuid;
    v_limit := coalesce(nullif(v_pkg->>'doctorMeetingsPerMonth', '')::int, 0);
    v_title := 'Doktor Görüşmesi';
  else
    v_key := 'dietitianSessions';
    select assigned_dietitian_id into v_staff_id from public.members where id = v_uid;
    if v_staff_id is null then v_staff_id := nullif(v_data->>'assignedDietitianId', '')::uuid; end if;
    v_limit := coalesce(nullif(v_pkg->>'dietitianMeetingsPerMonth', '')::int, 0);
    v_title := 'Diyetisyen Görüşmesi';
  end if;

  if v_staff_id is null then raise exception 'Bu randevu türü için atanmış bir uzman yok.'; end if;

  select coalesce(data, '{}'::jsonb), name into v_staff_data, v_staff_name
  from public.staff where id = v_staff_id;
  if v_staff_data is null then raise exception 'Uzman bulunamadı.'; end if;

  v_avail := coalesce(v_staff_data->'availability', '{}'::jsonb);
  v_dow := extract(dow from (p_starts_at at time zone 'Europe/Istanbul'))::int;
  v_hour := lpad(extract(hour from (p_starts_at at time zone 'Europe/Istanbul'))::text, 2, '0') || ':00';
  if not ((v_avail -> v_dow::text) ? v_hour) then
    raise exception 'Seçilen saat uzmanın müsaitliği dışında.';
  end if;

  -- Çakışma: aynı uzman + tür + tam başlangıç, herhangi bir üyede aktif randevu var mı?
  select count(*) into v_taken
  from public.members m
  cross join lateral jsonb_array_elements(coalesce(m.data->v_key, '[]'::jsonb)) s
  where (
    (v_type = 'coach'
      and (m.assigned_coach_id = v_staff_id or m.data->>'assignedCoachId' = v_staff_id::text))
    or (v_type = 'dietitian'
      and (m.assigned_dietitian_id = v_staff_id or m.data->>'assignedDietitianId' = v_staff_id::text))
    or (v_type = 'doctor' and m.data->>'assignedDoctorId' = v_staff_id::text)
  )
  and coalesce(s->>'status', 'scheduled') in ('scheduled', 'rescheduled')
  and (s->>'date') is not null
  and (s->>'date') ~ '^\d{4}-\d{2}-\d{2}T'
  and (s->>'date')::timestamptz = p_starts_at;
  if v_taken > 0 then raise exception 'Bu saat dolu, lütfen başka bir slot seçin.'; end if;

  -- Aylık paket limiti (bu üye, aynı tür, aynı takvim ayı)
  if v_limit > 0 then
    select count(*) into v_used
    from jsonb_array_elements(coalesce(v_data->v_key, '[]'::jsonb)) s
    where coalesce(s->>'status', 'scheduled') in ('scheduled', 'rescheduled')
      and (s->>'date') is not null
      and (s->>'date') ~ '^\d{4}-\d{2}-\d{2}T'
      and date_trunc('month', ((s->>'date')::timestamptz at time zone 'Europe/Istanbul'))
          = date_trunc('month', (p_starts_at at time zone 'Europe/Istanbul'));
    if v_used >= v_limit then
      raise exception 'Bu ay için randevu hakkınız doldu (%/%).', v_used, v_limit;
    end if;
  end if;

  v_session := jsonb_build_object(
    'id', 'bk-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    'type', v_type,
    'title', v_title,
    'date', to_char(p_starts_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'duration', greatest(coalesce(p_duration, 30), 15),
    'status', 'scheduled',
    'coach', coalesce(v_staff_name, ''),
    'bookedBy', 'member',
    'createdAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
  );
  v_sessions := coalesce(v_data->v_key, '[]'::jsonb) || v_session;

  update public.members
  set data = jsonb_set(coalesce(data, '{}'::jsonb), array[v_key], v_sessions, true),
      updated_at = now()
  where id = v_uid;

  return v_session;
end;
$$;

revoke all on function public.book_staff_session(text, timestamptz, int) from public, anon;
grant execute on function public.book_staff_session(text, timestamptz, int) to authenticated;
