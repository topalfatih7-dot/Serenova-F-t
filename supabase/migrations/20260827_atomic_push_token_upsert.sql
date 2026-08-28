-- Atomik push token kayıt: RLS bypass ile aynı token'ı başka kullanıcılardan temizler
-- Neden gerekli: RLS DELETE politikası kullanıcı kendi satırını silebilir, başkasınkini SİLEMEZ.
-- Aynı fiziksel cihaz farklı hesaplarla kullanılırsa (staff/member login switch) unique index
-- (expo_push_token) üzerinde çakışma oluşur ve INSERT sessizce başarısız olur.
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
  -- Aynı token başka bir kullanıcıya aitse temizle (cihaz transfer)
  delete from public.device_push_tokens
  where expo_push_token = p_token
    and user_id <> auth.uid();
  -- Mevcut kullanıcının eski tokenını kaldır (farklı token ile tekrar kayıt)
  delete from public.device_push_tokens
  where user_id = auth.uid()
    and expo_push_token <> p_token;
  -- Upsert: user_id PK çakışmasında güncelle
  insert into public.device_push_tokens (user_id, expo_push_token, platform, updated_at)
  values (auth.uid(), p_token, p_platform, now())
  on conflict (user_id) do update
    set expo_push_token = excluded.expo_push_token,
        platform = excluded.platform,
        updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.upsert_device_push_token(text, text) from public, anon;
grant execute on function public.upsert_device_push_token(text, text) to authenticated;
