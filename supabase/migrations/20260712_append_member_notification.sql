-- Personel / admin / üye: members.data.notifications dizisine atomik ekleme (program + mesaj bildirimleri)

create or replace function public.append_member_notification(
  p_member_id uuid,
  p_notification jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_member_id is null or p_notification is null then
    return;
  end if;

  if not (
    public.is_admin()
    or auth.uid() = p_member_id
    or public.staff_manages_member(p_member_id)
  ) then
    raise exception 'Bildirim eklenemedi: yetki yok';
  end if;

  update public.members
  set
    data = jsonb_set(
      coalesce(data, '{}'::jsonb),
      '{notifications}',
      jsonb_build_array(p_notification) || coalesce(data->'notifications', '[]'::jsonb),
      true
    ),
    updated_at = now()
  where id = p_member_id;
end;
$$;

revoke all on function public.append_member_notification(uuid, jsonb) from public;
grant execute on function public.append_member_notification(uuid, jsonb) to authenticated;
