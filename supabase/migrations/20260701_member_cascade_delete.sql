-- Üye silindiğinde tüm ilişkili kayıtlar kaldırılsın (SET NULL yerine CASCADE)
-- Yetim kayıtları temizle + admin_delete_member RPC

-- 1) Yetim kayıtları sil (manuel silinen üyelerden kalan)
delete from public.payments
where member_id is null
   or not exists (select 1 from public.members m where m.id = payments.member_id);

delete from public.tickets
where member_id is null
   or not exists (select 1 from public.members m where m.id = tickets.member_id);

delete from public.activities
where member_id is null
   or not exists (select 1 from public.members m where m.id = activities.member_id);

delete from public.programs
where member_id is not null
  and not exists (select 1 from public.members m where m.id = programs.member_id);

-- chat_threads: member yoksa thread + mesajlar
delete from public.chat_messages
where thread_id in (
  select ct.id from public.chat_threads ct
  where not exists (select 1 from public.members m where m.id = ct.member_id)
);

delete from public.chat_threads
where not exists (select 1 from public.members m where m.id = chat_threads.member_id);

-- 2) FK: ON DELETE CASCADE
alter table public.payments drop constraint if exists payments_member_id_fkey;
alter table public.payments
  add constraint payments_member_id_fkey
  foreign key (member_id) references public.members(id) on delete cascade;

alter table public.tickets drop constraint if exists tickets_member_id_fkey;
alter table public.tickets
  add constraint tickets_member_id_fkey
  foreign key (member_id) references public.members(id) on delete cascade;

alter table public.activities drop constraint if exists activities_member_id_fkey;
alter table public.activities
  add constraint activities_member_id_fkey
  foreign key (member_id) references public.members(id) on delete cascade;

-- 3) Admin üye silme RPC
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

  if v_role = 'admin' or lower(coalesce(v_email, '')) = 'admin@serenova.fit' then
    raise exception 'Admin hesabı silinemez.';
  end if;

  -- CASCADE: programs, payments, tickets, activities, chat_threads (+ messages)
  delete from public.members where id = p_id;

  -- auth + user_presence + identities
  delete from auth.users where id = p_id;
end;
$$;

revoke all on function public.admin_delete_member(uuid) from public, anon;
grant execute on function public.admin_delete_member(uuid) to authenticated;
