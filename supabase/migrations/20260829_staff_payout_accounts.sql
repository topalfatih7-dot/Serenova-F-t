-- Personel hakediş IBAN / banka hesabı
-- staff.data ve staff_public içinde TUTULMAZ (kadro sayfalarına sızmasın).

create or replace function public.tr_iban_is_valid(p_iban text)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  compact text;
  rearranged text;
  numeric_str text := '';
  i int;
  ch text;
  remainder numeric := 0;
begin
  compact := upper(regexp_replace(coalesce(p_iban, ''), '[\s-]', '', 'g'));
  if compact !~ '^TR[0-9]{24}$' then
    return false;
  end if;
  if substr(compact, 10, 1) <> '0' then
    return false;
  end if;
  rearranged := substr(compact, 5) || substr(compact, 1, 4);
  for i in 1..char_length(rearranged) loop
    ch := substr(rearranged, i, 1);
    if ch ~ '[A-Z]' then
      numeric_str := numeric_str || (ascii(ch) - 55)::text;
    else
      numeric_str := numeric_str || ch;
    end if;
  end loop;
  i := 1;
  while i <= char_length(numeric_str) loop
    remainder := (remainder::text || substr(numeric_str, i, least(7, char_length(numeric_str) - i + 1)))::numeric % 97;
    i := i + 7;
  end loop;
  return remainder = 1;
end;
$$;

revoke all on function public.tr_iban_is_valid(text) from public, anon;
grant execute on function public.tr_iban_is_valid(text) to authenticated, service_role;

create table if not exists public.staff_payout_accounts (
  staff_id uuid primary key references public.staff(id) on delete cascade,
  account_holder_name text not null default '',
  iban text not null,
  bank_code text not null,
  bank_name text not null default '',
  account_type text not null default 'individual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_payout_accounts_holder_chk
    check (char_length(trim(account_holder_name)) >= 3),
  constraint staff_payout_accounts_iban_chk
    check (public.tr_iban_is_valid(iban)),
  constraint staff_payout_accounts_bank_code_chk
    check (bank_code ~ '^[0-9]{5}$'),
  constraint staff_payout_accounts_bank_match_chk
    check (substr(iban, 5, 5) = bank_code),
  constraint staff_payout_accounts_type_chk
    check (account_type in ('individual', 'business'))
);

create index if not exists staff_payout_accounts_bank_code_idx
  on public.staff_payout_accounts (bank_code);

comment on table public.staff_payout_accounts is
  'Personel hakediş alıcı hesabı — yalnızca ilgili personel yazar, admin okur.';

alter table public.staff_payout_accounts enable row level security;

drop policy if exists staff_payout_accounts_select on public.staff_payout_accounts;
create policy staff_payout_accounts_select
  on public.staff_payout_accounts
  for select
  to authenticated
  using (
    staff_id = (select public.current_staff_id())
    or public.is_admin()
  );

drop policy if exists staff_payout_accounts_insert on public.staff_payout_accounts;
create policy staff_payout_accounts_insert
  on public.staff_payout_accounts
  for insert
  to authenticated
  with check (staff_id = (select public.current_staff_id()));

drop policy if exists staff_payout_accounts_update on public.staff_payout_accounts;
create policy staff_payout_accounts_update
  on public.staff_payout_accounts
  for update
  to authenticated
  using (staff_id = (select public.current_staff_id()))
  with check (staff_id = (select public.current_staff_id()));

revoke all on table public.staff_payout_accounts from anon, public;
grant select, insert, update on table public.staff_payout_accounts to authenticated;
grant all on table public.staff_payout_accounts to service_role;

create or replace function public.staff_payout_accounts_touch()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.iban := upper(regexp_replace(coalesce(new.iban, ''), '[\s-]', '', 'g'));
  new.bank_code := lpad(regexp_replace(coalesce(new.bank_code, ''), '\D', '', 'g'), 5, '0');
  new.account_holder_name := btrim(new.account_holder_name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_staff_payout_accounts_touch on public.staff_payout_accounts;
create trigger trg_staff_payout_accounts_touch
  before insert or update on public.staff_payout_accounts
  for each row
  execute function public.staff_payout_accounts_touch();

revoke all on function public.staff_payout_accounts_touch() from public, anon, authenticated;

-- Savunma: IBAN asla public kadro JSONB'sine sızmasın
create or replace function public.strip_staff_contact_fields(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select (coalesce(p_data, '{}'::jsonb))
    - 'phone' - 'instagram' - 'youtube' - 'website' - 'linkedin'
    - 'iban' - 'bankCode' - 'bankName' - 'bank' - 'payoutIban'
    - 'accountHolder' - 'accountHolderName' - 'payoutAccount';
$$;
