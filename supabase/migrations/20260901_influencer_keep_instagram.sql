-- Influencer Instagram data JSONB'de tutulur. Yazma tetikleyicisi yanlışlıkla
-- kadro kamuya-sızdırma fonksiyonunu (strip_staff_contact_fields) çağırıyordu;
-- o fonksiyon instagram anahtarını sildiği için kayıt sessizce kayboluyordu.

create or replace function public.strip_influencer_data_fields(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select coalesce(p_data, '{}'::jsonb)
    - 'iban' - 'bankCode' - 'bankName' - 'bank' - 'payoutIban'
    - 'accountHolder' - 'accountHolderName' - 'payoutAccount'
    - 'phone' - 'email' - 'whatsapp';
$$;

create or replace function public.influencers_before_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.email := lower(trim(coalesce(new.email, '')));
  new.name := btrim(coalesce(new.name, ''));
  new.phone := btrim(coalesce(new.phone, ''));
  new.code := upper(regexp_replace(btrim(coalesce(new.code, '')), '\s', '', 'g'));
  new.data := public.strip_influencer_data_fields(coalesce(new.data, '{}'::jsonb));
  new.updated_at := now();
  if new.code !~ '^[A-Z0-9]{4,20}$' then
    raise exception 'Kod 4–20 karakter, yalnızca harf ve rakam olmalı.';
  end if;
  if char_length(new.name) < 2 then
    raise exception 'Ad gerekli.';
  end if;
  if position('@' in new.email) < 2 then
    raise exception 'Geçerli e-posta gerekli.';
  end if;
  return new;
end;
$$;

revoke all on function public.influencers_before_write() from public, anon, authenticated;
