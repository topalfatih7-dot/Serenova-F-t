-- Bildirim okundu: tüm members.data blob'unu ezmeden yalnızca read bayrağı.
-- Sohbet unread: mesaj insert trigger'ı atomik artırır; okuma RPC'si yalnızca sayacı sıfırlar.

create or replace function public.mark_member_notifications_read(p_ids text[] default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_notifications jsonb;
begin
  if auth.uid() is null then
    raise exception 'Bildirim okunamadı: oturum yok';
  end if;

  update public.members
  set
    data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      (
        select coalesce(
          jsonb_agg(
            case
              when p_ids is null or t.n->>'id' = any(p_ids)
                then t.n || jsonb_build_object('read', true)
              else t.n
            end
            order by t.ord
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(coalesce(data->'notifications', '[]'::jsonb))
          with ordinality as t(n, ord)
      ),
      true
    ),
    updated_at = now()
  where id = auth.uid()
  returning data->'notifications' into v_notifications;

  if v_notifications is null then
    raise exception 'Bildirim okunamadı: üye kaydı yok';
  end if;

  return v_notifications;
end;
$$;

revoke all on function public.mark_member_notifications_read(text[]) from public, anon;
grant execute on function public.mark_member_notifications_read(text[]) to authenticated;

create or replace function public.mark_staff_notifications_read(p_ids text[] default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := public.current_staff_id();
  v_notifications jsonb;
begin
  if v_id is null then
    raise exception 'Yetkisiz: personel oturumu gerekli.';
  end if;

  update public.staff
  set data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      (
        select coalesce(
          jsonb_agg(
            case
              when p_ids is null or t.n->>'id' = any(p_ids)
                then t.n || jsonb_build_object('read', true)
              else t.n
            end
            order by t.ord
          ),
          '[]'::jsonb
        )
        from jsonb_array_elements(coalesce(data->'notifications', '[]'::jsonb))
          with ordinality as t(n, ord)
      ),
      true
    )
  where id = v_id
  returning data->'notifications' into v_notifications;

  return coalesce(v_notifications, '[]'::jsonb);
end;
$$;

revoke all on function public.mark_staff_notifications_read(text[]) from public, anon;
grant execute on function public.mark_staff_notifications_read(text[]) to authenticated;

create or replace function public.mark_chat_thread_read(p_thread_id uuid, p_reader text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row public.chat_threads%rowtype;
  v_patch jsonb;
begin
  if p_thread_id is null or p_reader not in ('member', 'staff') then
    raise exception 'Geçersiz okuma isteği';
  end if;

  select * into v_row from public.chat_threads where id = p_thread_id;
  if not found then
    return null;
  end if;

  if p_reader = 'member' then
    if not (public.is_admin() or v_row.member_id = auth.uid()) then
      raise exception 'Sohbet okunamadı: yetki yok';
    end if;
    v_patch := jsonb_build_object('memberUnread', 0);
  else
    if not (public.is_admin() or public.staff_manages_member(v_row.member_id)) then
      raise exception 'Sohbet okunamadı: yetki yok';
    end if;
    v_patch := jsonb_build_object('staffUnread', 0);
  end if;

  update public.chat_threads
  set data = coalesce(data, '{}'::jsonb) || v_patch
  where id = p_thread_id
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.mark_chat_thread_read(uuid, text) from public, anon;
grant execute on function public.mark_chat_thread_read(uuid, text) to authenticated;

create or replace function public.tg_chat_message_touch_thread()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_text text := coalesce(NEW.data->>'text', '');
  v_preview text;
  v_unread_key text;
begin
  v_preview := left(v_text, 120);
  if char_length(v_text) > 120 then
    v_preview := left(v_text, 119) || '…';
  end if;

  v_unread_key := case
    when NEW.sender_type = 'member' then 'staffUnread'
    when NEW.sender_type = 'staff' then 'memberUnread'
    else null
  end;

  update public.chat_threads t
  set
    last_message_at = now(),
    data = coalesce(t.data, '{}'::jsonb)
      || jsonb_build_object('lastPreview', v_preview)
      || case
        when v_unread_key is null then '{}'::jsonb
        else jsonb_build_object(
          v_unread_key,
          coalesce((t.data ->> v_unread_key)::int, 0) + 1
        )
      end
  where t.id = NEW.thread_id;

  return NEW;
end;
$$;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
  after insert on public.chat_messages
  for each row execute function public.tg_chat_message_touch_thread();
