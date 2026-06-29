-- Personel kendi profil güncellemesi: RLS düzeltmesi + güvenli RPC
-- - staff_self_update: büyük/küçük harf duyarsız e-posta eşleşmesi
-- - staff_update_self_profile: yalnızca name + data; kilitli alanlar korunur

drop policy if exists staff_self_update on public.staff;
create policy staff_self_update on public.staff for update
  using (lower(email) = lower(public.current_email()))
  with check (
    lower(email) = lower(public.current_email())
    and id = public.current_staff_id()
  );

create or replace function public.staff_update_self_profile(
  p_name text,
  p_data jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid := public.current_staff_id();
  v_current jsonb;
  v_merged jsonb;
begin
  if v_id is null then
    raise exception 'Yetkisiz: personel oturumu gerekli.';
  end if;

  select coalesce(data, '{}'::jsonb) into v_current
  from public.staff
  where id = v_id;

  -- Düzenlenebilir alanları birleştir; başvuru onaylı alanları mevcut kayıttan koru
  v_merged := coalesce(v_current, '{}'::jsonb)
    || coalesce(p_data, '{}'::jsonb)
    || jsonb_build_object(
      'specialty', v_current->'specialty',
      'specialties', coalesce(v_current->'specialties', '[]'::jsonb),
      'experienceYears', coalesce(v_current->'experienceYears', to_jsonb(0)),
      'languages', coalesce(v_current->'languages', '["Türkçe"]'::jsonb),
      'education', coalesce(v_current->'education', '[]'::jsonb),
      'experiences', coalesce(v_current->'experiences', '[]'::jsonb),
      'certificates', coalesce(v_current->'certificates', '[]'::jsonb)
    );

  update public.staff
  set
    name = coalesce(nullif(trim(p_name), ''), name),
    data = v_merged
  where id = v_id;

  return v_id;
end;
$$;

revoke all on function public.staff_update_self_profile(text, jsonb) from public, anon;
grant execute on function public.staff_update_self_profile(text, jsonb) to authenticated;
