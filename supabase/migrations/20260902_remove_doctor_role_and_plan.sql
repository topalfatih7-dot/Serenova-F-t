-- Doktor personel rolü, Doktor Paketi ve assigned_doctor_id kaldırılır.
-- Geçmiş migration dosyalarına dokunulmaz.

-- MCP / SQL editor JWT service_role değil; atama trigger'ı üye güncellemesini keser.
alter table public.members disable trigger trg_enforce_member_privileged_fields;

-- ── 1) Üye JSON / atama / paket temizliği ───────────────────────────────────
update public.members
set
  assigned_doctor_id = null,
  membership = case when membership = 'doktor' then 'free' else membership end,
  data = coalesce(data, '{}'::jsonb)
    - 'assignedDoctorId'
    || jsonb_build_object(
      'assignedDoctorId', null,
      'doctorSessions', '[]'::jsonb
    );

update public.members
set data = jsonb_set(
  data,
  '{activePackages}',
  coalesce((
    select jsonb_agg(p)
    from jsonb_array_elements(coalesce(data->'activePackages', '[]'::jsonb)) p
    where coalesce(p->>'planId', '') <> 'doktor'
  ), '[]'::jsonb)
)
where data ? 'activePackages';

update public.members
set data = jsonb_set(
  data,
  '{packageConfig}',
  (coalesce(data->'packageConfig', '{}'::jsonb)
    - 'doctorSessionsTotal'
    - 'doctorMeetingsPerMonth'
    - 'doctorSessionsRemaining')
)
where data ? 'packageConfig';

delete from public.payments
where coalesce(data->>'planId', '') = 'doktor';

-- ── 2) Sohbet / collab ──────────────────────────────────────────────────────
delete from public.chat_messages
where thread_id in (select id from public.chat_threads where staff_role = 'doctor');

delete from public.chat_threads where staff_role = 'doctor';

delete from public.staff_collab_messages
where sender_type = 'doctor'
   or thread_id in (select id from public.staff_collab_threads where doctor_id is not null);

update public.staff_collab_threads set doctor_id = null where doctor_id is not null;

-- ── 3) Auth oturumları + doktor personel ────────────────────────────────────
do $$
declare
  doc_ids uuid[];
begin
  select coalesce(array_agg(id), '{}') into doc_ids
  from public.staff where role = 'doctor';

  if array_length(doc_ids, 1) is not null then
    delete from public.device_push_tokens where user_id = any (doc_ids);
    delete from public.user_presence where user_id = any (doc_ids);
    delete from public.chat_messages
    where thread_id in (select id from public.chat_threads where staff_id = any (doc_ids));
    delete from public.chat_threads where staff_id = any (doc_ids);
    update public.programs set staff_id = null where staff_id = any (doc_ids);
    delete from auth.sessions where user_id = any (doc_ids);
    delete from auth.identities where user_id = any (doc_ids);
  end if;

  delete from public.staff where role = 'doctor';

  if array_length(doc_ids, 1) is not null then
    delete from auth.users where id = any (doc_ids);
  end if;
end $$;

-- ── 4) Plan kaydı + pazarlama kopyası ───────────────────────────────────────
delete from public.plans where id = 'doktor';

update public.plans
set
  sort_order = 4,
  updated_at = now()
where id = 'vip' and coalesce(sort_order, 0) = 5;

update public.plans
set
  features = coalesce((
    select jsonb_agg(
      case
        when elem->>'text' ilike '%doktor tarafından kan tahlili%'
          then jsonb_set(elem, '{text}', '"Kan Tahlili Testi Analizi"')
        else elem
      end
    )
    from jsonb_array_elements(coalesce(features, '[]'::jsonb)) elem
  ), features),
  entitlements = coalesce(entitlements, '{}'::jsonb)
    - 'doctorMeetingsPerMonth'
    - 'doctorSessionsTotal',
  updated_at = now()
where features is not null or entitlements is not null;

update public.site_content
set data = jsonb_set(
  data,
  '{a}',
  to_jsonb(
    replace(
      replace(
        coalesce(data->>'a', ''),
        'Eko Diyet, Diyet, Eko Spor, Spor, Doktor veya VIP',
        'Eko Diyet, Diyet, Eko Spor, Spor veya VIP'
      ),
      'Doktor paketinde ve süre bitmiş (ücretsiz fallback) üyelikte kalori AI kapalıdır. ',
      'Süre bitmiş (ücretsiz fallback) üyelikte kalori AI kapalıdır. '
    )
  )
)
where kind = 'faq'
  and (
    coalesce(data->>'a', '') ilike '%doktor%'
  );

-- ── 5) Fonksiyonlar (kolon düşmeden önce doktor dallarını kes) ─────────────
create or replace function public.staff_manages_member(p_member_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.members m
    join public.staff s on (
      s.id = m.assigned_coach_id
      or s.id = m.assigned_dietitian_id
    )
    where m.id = p_member_id
      and lower(s.email) = lower(public.current_email())
  );
$$;

create or replace function public.append_staff_notification(
  p_staff_id uuid,
  p_notification jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_staff_id is null or p_notification is null then
    return;
  end if;

  if not (
    public.is_admin()
    or public.current_staff_id() = p_staff_id
    or (
      public.current_staff_id() is not null
      and exists (select 1 from public.staff t where t.id = p_staff_id)
    )
    or exists (
      select 1 from public.members m
      where m.id = auth.uid()
        and (
          m.assigned_coach_id = p_staff_id
          or m.assigned_dietitian_id = p_staff_id
        )
    )
  ) then
    raise exception 'Bildirim eklenemedi: yetki yok';
  end if;

  update public.staff
  set data = jsonb_set(
    coalesce(data, '{}'::jsonb),
    '{notifications}',
    jsonb_build_array(p_notification) || coalesce(data->'notifications', '[]'::jsonb),
    true
  )
  where id = p_staff_id;
end;
$$;

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
        else 'dietitianSessions' end),
      '[]'::jsonb)
  ) as s
  where (
    (lower(p_type) = 'coach'
      and (m.assigned_coach_id = p_staff_id or m.data->>'assignedCoachId' = p_staff_id::text))
    or (lower(p_type) = 'dietitian'
      and (m.assigned_dietitian_id = p_staff_id or m.data->>'assignedDietitianId' = p_staff_id::text))
  )
  and coalesce(s->>'status', 'scheduled') in (
    'pending',
    'scheduled',
    'rescheduled',
    'cancel_pending',
    'admin_cancel_pending'
  )
  and (s->>'date') is not null
  and (s->>'date') ~ '^\d{4}-\d{2}-\d{2}T'
  and (s->>'date')::timestamptz >= p_from
  and (s->>'date')::timestamptz < p_to;
$$;

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
  v_member_name text;
  v_avail jsonb;
  v_dow int;
  v_hour text;
  v_limit int := 0;
  v_used int := 0;
  v_taken int := 0;
  v_session jsonb;
  v_sessions jsonb;
  v_title text;
  v_notif jsonb;
  v_when text;
begin
  if v_uid is null then raise exception 'Yetkisiz: oturum gerekli.'; end if;
  if v_type not in ('coach', 'dietitian') then
    raise exception 'Geçersiz randevu türü.';
  end if;
  if p_starts_at <= now() then raise exception 'Geçmiş bir zaman seçilemez.'; end if;

  select coalesce(data, '{}'::jsonb), name into v_data, v_member_name
  from public.members where id = v_uid;
  if v_data is null then raise exception 'Üye kaydı bulunamadı.'; end if;
  v_pkg := coalesce(v_data->'packageConfig', '{}'::jsonb);

  if v_type = 'coach' then
    v_key := 'coachSessions';
    select assigned_coach_id into v_staff_id from public.members where id = v_uid;
    v_limit := coalesce(nullif(v_pkg->>'coachMeetingsPerMonth', '')::int, 0);
    if v_limit = 0 then v_limit := coalesce(nullif(v_pkg->>'coachMeetingsPerWeek', '')::int, 0) * 4; end if;
    v_title := 'Koç Görüşmesi';
  else
    v_key := 'dietitianSessions';
    select assigned_dietitian_id into v_staff_id from public.members where id = v_uid;
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

  select count(*) into v_taken
  from public.staff_booked_slots(v_staff_id, v_type, p_starts_at, p_starts_at + interval '1 second');
  if v_taken > 0 then raise exception 'Bu saat dolu, lütfen başka bir slot seçin.'; end if;

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

  v_when := to_char(p_starts_at at time zone 'Europe/Istanbul', 'DD.MM.YYYY HH24:MI');
  v_notif := jsonb_build_object(
    'id', 'n-appointment-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    'type', 'appointment',
    'title', 'Yeni randevu',
    'message', coalesce(nullif(trim(v_member_name), ''), 'Danışan') || ' — ' || v_when,
    'read', false,
    'createdAt', to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'memberId', v_uid::text,
    'sessionId', v_session->>'id',
    'sessionType', v_type,
    'startsAt', v_session->>'date'
  );

  begin
    perform public.append_staff_notification(v_staff_id, v_notif);
  exception when others then
    null;
  end;

  return v_session;
end;
$$;

create or replace function public.admin_upsert_staff(
  p_id uuid,
  p_email text,
  p_password text,
  p_name text,
  p_role text,
  p_active boolean,
  p_data jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions, auth
as $function$
declare
  v_email     text := lower(trim(p_email));
  v_old_email text;
  v_uid       uuid;
  v_staff_id  uuid;
  v_role      text := case when p_role in ('coach','dietitian') then p_role else 'coach' end;
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
      set id = excluded.id, name = excluded.name, role = excluded.role,
          active = excluded.active, data = excluded.data
    returning id into v_staff_id;
  end if;

  return v_staff_id;
end
$function$;

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
    'assignedDietitianId'
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
       or new.assigned_dietitian_id is not null then
      raise exception 'Yetkisiz: personel ataması yalnızca admin tarafından yapılır.';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'Yetkisiz: rol alanı değiştirilemez.';
  end if;

  if new.assigned_coach_id is distinct from old.assigned_coach_id
     or new.assigned_dietitian_id is distinct from old.assigned_dietitian_id then
    raise exception 'Yetkisiz: personel ataması yalnızca admin tarafından yapılır.';
  end if;

  if new.membership is distinct from old.membership then
    if new.membership is distinct from 'free' then
      raise exception 'Yetkisiz: ücretli üyelik yalnızca ödeme sistemi veya admin tarafından açılır.';
    end if;
    return new;
  end if;

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

-- ── 6) View / RLS (kolon düşmeden) ──────────────────────────────────────────
drop view if exists public.members_staff_safe;
create view public.members_staff_safe
with (security_invoker = true)
as
select
  id,
  name,
  role,
  membership,
  membership_status,
  assigned_coach_id,
  assigned_dietitian_id,
  public.strip_member_contact_fields(data) as data,
  created_at,
  updated_at
from public.members
where public.staff_manages_member(id);

grant select on public.members_staff_safe to authenticated;

drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert on public.chat_threads for insert with check (
  public.is_admin()
  or public.staff_manages_member(member_id)
  or (
    member_id = (select auth.uid())
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and (
          staff_id = m.assigned_coach_id
          or staff_id = m.assigned_dietitian_id
        )
    )
  )
);

drop policy if exists members_select on public.members;
create policy members_select on public.members for select using (
  public.is_admin()
  or (id = (select auth.uid()))
  or exists (
    select 1 from public.staff s
    where (
      s.id = members.assigned_coach_id
      or s.id = members.assigned_dietitian_id
    )
    and lower(s.email) = lower(public.current_email())
  )
);

drop policy if exists members_update on public.members;
create policy members_update on public.members for update
using (
  public.is_admin()
  or (id = (select auth.uid()))
  or exists (
    select 1 from public.staff s
    where (
      s.id = members.assigned_coach_id
      or s.id = members.assigned_dietitian_id
    )
    and lower(s.email) = lower(public.current_email())
  )
)
with check (
  public.is_admin()
  or (id = (select auth.uid()))
  or exists (
    select 1 from public.staff s
    where (
      s.id = members.assigned_coach_id
      or s.id = members.assigned_dietitian_id
    )
    and lower(s.email) = lower(public.current_email())
  )
);

drop policy if exists staff_collab_threads_select on public.staff_collab_threads;
create policy staff_collab_threads_select on public.staff_collab_threads for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
);

drop policy if exists staff_collab_threads_insert on public.staff_collab_threads;
create policy staff_collab_threads_insert on public.staff_collab_threads for insert with check (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
);

drop policy if exists staff_collab_threads_update on public.staff_collab_threads;
create policy staff_collab_threads_update on public.staff_collab_threads for update using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
);

drop policy if exists staff_collab_messages_select on public.staff_collab_messages;
create policy staff_collab_messages_select on public.staff_collab_messages for select using (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.coach_id = (select auth.uid())
        or t.dietitian_id = (select auth.uid())
      )
  )
);

drop policy if exists staff_collab_messages_insert on public.staff_collab_messages;
create policy staff_collab_messages_insert on public.staff_collab_messages for insert with check (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        (sender_type = 'coach' and t.coach_id = (select auth.uid()))
        or (sender_type = 'dietitian' and t.dietitian_id = (select auth.uid()))
        or public.is_admin()
      )
  )
);

-- ── 7) Kolon / constraint ───────────────────────────────────────────────────
alter table public.staff_collab_threads drop constraint if exists staff_collab_threads_doctor_id_fkey;
alter table public.staff_collab_threads drop column if exists doctor_id;

drop index if exists idx_members_assigned_doctor_id;
alter table public.members drop column if exists assigned_doctor_id;

alter table public.staff drop constraint if exists staff_role_check;
alter table public.staff add constraint staff_role_check
  check (role in ('coach', 'dietitian'));

alter table public.chat_threads drop constraint if exists chat_threads_staff_role_check;
alter table public.chat_threads add constraint chat_threads_staff_role_check
  check (staff_role in ('coach', 'dietitian'));

alter table public.staff_collab_messages drop constraint if exists staff_collab_messages_sender_type_check;
alter table public.staff_collab_messages add constraint staff_collab_messages_sender_type_check
  check (sender_type in ('coach', 'dietitian'));

alter table public.members enable trigger trg_enforce_member_privileged_fields;
