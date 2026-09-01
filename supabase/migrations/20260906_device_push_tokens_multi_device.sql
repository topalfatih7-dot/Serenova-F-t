-- Çoklu cihaz: aynı kullanıcı iPhone + Android.
-- Gönderim zaten user_id ile tüm satırları okur. PK 1:1 bunu engelliyordu.
-- Unique expo_push_token kalır (cihaz tek sahibi). RLS dokunulmaz.

alter table public.device_push_tokens
  drop constraint if exists device_push_tokens_pkey;

alter table public.device_push_tokens
  add constraint device_push_tokens_pkey
  primary key (user_id, expo_push_token);

create index if not exists device_push_tokens_user_id_idx
  on public.device_push_tokens (user_id);

create or replace function public.upsert_device_push_token(
  p_token text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Yetkisiz: oturum gerekli';
  end if;
  if p_token is null or p_token = '' then
    raise exception 'Token boş olamaz';
  end if;
  -- Aynı fiziksel token başka hesaptaysa al (üye↔personel aynı telefon)
  delete from public.device_push_tokens
  where expo_push_token = p_token
    and user_id <> auth.uid();
  insert into public.device_push_tokens (user_id, expo_push_token, platform, updated_at)
  values (auth.uid(), p_token, coalesce(nullif(p_platform, ''), 'unknown'), now())
  on conflict (user_id, expo_push_token) do update
    set platform = excluded.platform,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.upsert_device_push_token(text, text) from public, anon;
grant execute on function public.upsert_device_push_token(text, text) to authenticated;
