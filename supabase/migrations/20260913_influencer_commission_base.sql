-- Influencer ilk-ödeme komisyon tabanı (admin, influencer başına) + hakediş snapshot.
-- İndirim Stripe kuponu duration=once (yeni ID); üye indirimi members.data JSONB’de bir kez işaretlenir.
-- Eski forever kupon yeniform_influencer_10_sub ve geçmiş hakediş satırları dokunulmaz.

alter table public.influencers
  add column if not exists commission_base text not null default 'discounted';

alter table public.influencers
  drop constraint if exists influencers_commission_base_chk;

alter table public.influencers
  add constraint influencers_commission_base_chk
  check (commission_base in ('list_price', 'discounted'));

alter table public.influencer_earnings
  add column if not exists commission_base text,
  add column if not exists is_first_payment boolean not null default false;

alter table public.influencer_earnings
  drop constraint if exists influencer_earnings_commission_base_chk;

alter table public.influencer_earnings
  add constraint influencer_earnings_commission_base_chk
  check (commission_base is null or commission_base in ('list_price', 'discounted'));

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
  new.commission_base := case
    when new.commission_base = 'list_price' then 'list_price'
    else 'discounted'
  end;
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

create or replace function public.influencers_guard_immutable()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_admin()
     or coalesce((select auth.jwt() ->> 'role'), '') = 'service_role' then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.code is distinct from old.code
     or new.email is distinct from old.email
     or new.active is distinct from old.active
     or new.commission_base is distinct from old.commission_base then
    raise exception 'Kod, e-posta, hesap durumu ve komisyon tabanı yalnızca admin tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

revoke all on function public.influencers_guard_immutable() from public, anon, authenticated;

comment on column public.influencers.commission_base is
  'İlk kodlu ödemede komisyon tabanı: discounted (ödenen) veya list_price (indirim öncesi). Yenileme her zaman ödenen tutar.';

comment on column public.influencer_earnings.commission_base is
  'İlk ödeme satırında o anki taban snapshot; yenilemede null.';

comment on column public.influencer_earnings.is_first_payment is
  'Checkout ilk ödemesi true; invoice.paid yenileme false.';

comment on table public.influencer_earnings is
  'Kodlu abonelik hakedişi — ilk Checkout (kupon once) ve sonraki tam fiyat yenilemeler. İptal / ödenmeyen faturada satır yok.';
