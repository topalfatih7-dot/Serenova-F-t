-- Savunma: ayrıcalıklı üye alanları, sohbet gönderen bağlama, CV bucket private,
-- program-scoped egzersiz videosu, destek talebi sahte admin yanıtı, personel rol kilidi.

-- ── 1) Üye JSON ayrıcalıklı alanlar (tam kütüphane / abonelik / su hedefi) ──
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
    'assignedDietitianId',
    'fullLibraryAccess',
    'stripeSubscriptionId',
    'waterTracking'
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
    new.data := coalesce(new.data, '{}'::jsonb);
    foreach k in array privileged_keys loop
      new.data := new.data - k;
    end loop;
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
    new.data := coalesce(new.data, '{}'::jsonb);
    foreach k in array privileged_keys loop
      if old.data ? k then
        new.data := jsonb_set(new.data, array[k], coalesce(old.data -> k, 'null'::jsonb), true);
      elsif new.data ? k then
        new.data := new.data - k;
      end if;
    end loop;
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

-- ── 2) Personel satırı: rol / e-posta / aktiflik istemciden kilitli ──
create or replace function public.enforce_staff_self_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  new.id := old.id;
  new.role := old.role;
  new.email := old.email;
  new.active := old.active;
  return new;
end;
$$;

drop trigger if exists trg_enforce_staff_self_columns on public.staff;
create trigger trg_enforce_staff_self_columns
  before update on public.staff
  for each row
  execute function public.enforce_staff_self_columns();

revoke all on function public.enforce_staff_self_columns() from public, anon, authenticated;

-- ── 3) Sohbet: gönderen kimliği oturumla bağlanır ──
drop policy if exists chat_messages_insert on public.chat_messages;
create policy chat_messages_insert
  on public.chat_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          (
            chat_messages.sender_type = 'member'
            and chat_messages.sender_id = (select auth.uid())
            and t.member_id = (select auth.uid())
          )
          or (
            chat_messages.sender_type = 'staff'
            and chat_messages.sender_id = (select auth.uid())
            and t.staff_id = (select auth.uid())
          )
          or (
            public.is_admin()
            and (
              chat_messages.sender_id = (select auth.uid())
              or chat_messages.sender_type = 'system'
            )
          )
        )
    )
  );

drop policy if exists admin_staff_messages_insert on public.admin_staff_messages;
create policy admin_staff_messages_insert
  on public.admin_staff_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_staff_threads t
      where t.id = admin_staff_messages.thread_id
        and (
          (
            admin_staff_messages.sender_type = 'admin'
            and public.is_admin()
            and admin_staff_messages.sender_id = (select auth.uid())
          )
          or (
            admin_staff_messages.sender_type = 'staff'
            and t.staff_id = public.current_staff_id()
            and admin_staff_messages.sender_id = public.current_staff_id()
          )
        )
    )
  );

-- ── 4) Destek talebi: üye geçmişi değiştiremez, admin gibi yazamaz ──
create or replace function public.enforce_ticket_member_writes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  old_msgs jsonb;
  new_msgs jsonb;
  rebuilt jsonb := '[]'::jsonb;
  old_msg jsonb;
  new_msg jsonb;
begin
  if public.is_admin() then
    return new;
  end if;

  new.member_id := old.member_id;

  old_msgs := coalesce(old.data->'messages', '[]'::jsonb);
  new_msgs := coalesce(new.data->'messages', '[]'::jsonb);

  for old_msg in select value from jsonb_array_elements(old_msgs)
  loop
    rebuilt := rebuilt || jsonb_build_array(old_msg);
  end loop;

  for new_msg in select value from jsonb_array_elements(new_msgs)
  loop
    if coalesce(new_msg->>'id', '') <> ''
       and exists (
         select 1 from jsonb_array_elements(old_msgs) o
         where o->>'id' = new_msg->>'id'
       ) then
      continue;
    end if;
    rebuilt := rebuilt || jsonb_build_array(
      jsonb_set(coalesce(new_msg, '{}'::jsonb), '{from}', '"member"', true)
    );
  end loop;

  new.data := jsonb_set(coalesce(new.data, '{}'::jsonb), '{messages}', rebuilt, true);
  return new;
end;
$$;

drop trigger if exists trg_enforce_ticket_member_writes on public.tickets;
create trigger trg_enforce_ticket_member_writes
  before update on public.tickets
  for each row
  execute function public.enforce_ticket_member_writes();

revoke all on function public.enforce_ticket_member_writes() from public, anon, authenticated;

-- ── 5) Personel bildirimi: herhangi bir personel → her personel yok ──
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
    or exists (
      select 1 from public.staff_collab_threads t
      where (
        (t.coach_id = public.current_staff_id() and t.dietitian_id = p_staff_id)
        or (t.dietitian_id = public.current_staff_id() and t.coach_id = p_staff_id)
      )
    )
    or exists (
      select 1 from public.members m
      where m.id = (select auth.uid())
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

revoke all on function public.append_staff_notification(uuid, jsonb) from public, anon;
grant execute on function public.append_staff_notification(uuid, jsonb) to authenticated, service_role;

-- ── 6) Başvuru belgeleri: public bucket kapat ──
update storage.buckets
set public = false
where id = 'staff-application-docs';

-- ── 7) Egzersiz videosu: program-scoped (personel/admin / tam kütüphane hakkı hariç) ──
create or replace function public.can_access_exercise_video(p_path text)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    p_path is not null
    and p_path ~ '^[\w.-]+$'
    and position('..' in p_path) = 0
    and (
      public.is_admin()
      or public.current_staff_id() is not null
      or exists (
        select 1 from public.members m
        where m.id = (select auth.uid())
          and m.membership is distinct from 'free'
          and (
            coalesce(m.data->>'fullLibraryAccess', '') = 'true'
            or exists (
              select 1 from public.programs p
              where p.member_id = m.id
                and (
                  p.data->>'source' = 'library_catalog'
                  or coalesce(p.data->>'fullLibraryAccess', '') = 'true'
                )
            )
            or exists (
              select 1
              from public.programs p
              join public.exercises e on e.video_url = p_path
              where p.member_id = m.id
                and coalesce(p.data->'entries', '[]'::jsonb)
                  @> jsonb_build_array(jsonb_build_object('exerciseId', e.id::text))
            )
          )
      )
    );
$$;

revoke all on function public.can_access_exercise_video(text) from public, anon;
grant execute on function public.can_access_exercise_video(text) to authenticated, service_role;

drop policy if exists "exercise videos authenticated read" on storage.objects;
create policy "exercise videos authenticated read"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'exercise-videos'
    and public.can_access_exercise_video(name)
  );
