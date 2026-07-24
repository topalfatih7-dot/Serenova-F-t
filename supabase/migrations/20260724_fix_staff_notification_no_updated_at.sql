-- staff tablosunda updated_at yok; bildirim RPC'lerinden kaldır

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
      select 1 from public.members m
      where m.id = auth.uid()
        and (
          m.assigned_coach_id = p_staff_id
          or m.assigned_dietitian_id = p_staff_id
          or m.assigned_doctor_id = p_staff_id
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

create or replace function public.staff_set_notifications(
  p_notifications jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := public.current_staff_id();
begin
  if v_id is null then
    raise exception 'Yetkisiz: personel oturumu gerekli.';
  end if;

  update public.staff
  set data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      coalesce(p_notifications, '[]'::jsonb),
      true
    )
  where id = v_id;
end;
$$;
