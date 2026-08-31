-- Influencer paneli: hesap, tek kod, IBAN, hakediş
-- Kod checkout’ta %10; hakediş ödenen tutarın %20’si (yalnızca ilk Checkout).

create table if not exists public.influencers (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text not null default '',
  code text not null,
  active boolean not null default true,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint influencers_email_chk check (position('@' in email) > 1),
  constraint influencers_name_chk check (char_length(trim(name)) >= 2),
  constraint influencers_code_chk check (code ~ '^[A-Z0-9]{4,20}$')
);

create unique index if not exists influencers_email_lower_idx
  on public.influencers (lower(email));
create unique index if not exists influencers_code_idx
  on public.influencers (code);

create or replace function public.current_influencer_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.id
  from public.influencers i
  where i.id = (select auth.uid())
     or lower(i.email) = lower(public.current_email())
  limit 1;
$$;

revoke all on function public.current_influencer_id() from public, anon;
grant execute on function public.current_influencer_id() to authenticated, service_role;

-- IBAN/iletişim kopyalarını data JSONB'den sil; Instagram kalsın.
-- strip_staff_contact_fields kadro kamuya sızmayı kestiği için instagram'ı da siler —
-- influencer yazımında kullanılırsa profil kaydı sessizce kaybolur.
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

drop trigger if exists trg_influencers_before_write on public.influencers;
create trigger trg_influencers_before_write
  before insert or update on public.influencers
  for each row execute function public.influencers_before_write();

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
     or new.active is distinct from old.active then
    raise exception 'Kod, e-posta ve hesap durumu yalnızca admin tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_influencers_guard_immutable on public.influencers;
create trigger trg_influencers_guard_immutable
  before update on public.influencers
  for each row execute function public.influencers_guard_immutable();

revoke all on function public.influencers_guard_immutable() from public, anon, authenticated;

create table if not exists public.influencer_payout_accounts (
  influencer_id uuid primary key references public.influencers(id) on delete cascade,
  account_holder_name text not null default '',
  iban text not null,
  bank_code text not null,
  bank_name text not null default '',
  account_type text not null default 'individual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint influencer_payout_accounts_holder_chk
    check (char_length(trim(account_holder_name)) >= 3),
  constraint influencer_payout_accounts_iban_chk
    check (public.tr_iban_is_valid(iban)),
  constraint influencer_payout_accounts_bank_code_chk
    check (bank_code ~ '^[0-9]{5}$'),
  constraint influencer_payout_accounts_bank_match_chk
    check (substr(iban, 5, 5) = bank_code),
  constraint influencer_payout_accounts_type_chk
    check (account_type in ('individual', 'business'))
);

create or replace function public.influencer_payout_accounts_touch()
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

drop trigger if exists trg_influencer_payout_accounts_touch on public.influencer_payout_accounts;
create trigger trg_influencer_payout_accounts_touch
  before insert or update on public.influencer_payout_accounts
  for each row execute function public.influencer_payout_accounts_touch();

revoke all on function public.influencer_payout_accounts_touch() from public, anon, authenticated;

create table if not exists public.influencer_earnings (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.influencers(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  payment_id uuid references public.payments(id) on delete set null,
  stripe_session_id text,
  stripe_payment_intent text,
  code text not null,
  plan_id text not null default '',
  duration_months integer not null default 1,
  list_price_try numeric(12, 2) not null default 0,
  amount_paid_try numeric(12, 2) not null default 0,
  commission_rate numeric(6, 4) not null default 0.20,
  commission_try numeric(12, 2) not null default 0,
  period_key text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'reversed', 'rejected')),
  member_display_name text not null default '',
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists influencer_earnings_stripe_session_uidx
  on public.influencer_earnings (stripe_session_id)
  where stripe_session_id is not null and stripe_session_id <> '';

create index if not exists influencer_earnings_influencer_id_idx
  on public.influencer_earnings (influencer_id, created_at desc);
create index if not exists influencer_earnings_status_idx
  on public.influencer_earnings (status);
create index if not exists influencer_earnings_period_key_idx
  on public.influencer_earnings (period_key);
create index if not exists influencer_earnings_payment_intent_idx
  on public.influencer_earnings (stripe_payment_intent)
  where stripe_payment_intent is not null and stripe_payment_intent <> '';

create or replace function public.influencer_earnings_touch()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  new.code := upper(regexp_replace(btrim(coalesce(new.code, '')), '\s', '', 'g'));
  return new;
end;
$$;

drop trigger if exists trg_influencer_earnings_touch on public.influencer_earnings;
create trigger trg_influencer_earnings_touch
  before insert or update on public.influencer_earnings
  for each row execute function public.influencer_earnings_touch();

revoke all on function public.influencer_earnings_touch() from public, anon, authenticated;

-- RLS
alter table public.influencers enable row level security;
alter table public.influencer_payout_accounts enable row level security;
alter table public.influencer_earnings enable row level security;

drop policy if exists influencers_select on public.influencers;
create policy influencers_select on public.influencers
  for select to authenticated
  using (
    id = (select public.current_influencer_id())
    or public.is_admin()
  );

drop policy if exists influencers_update_self on public.influencers;
create policy influencers_update_self on public.influencers
  for update to authenticated
  using (
    id = (select public.current_influencer_id())
    or public.is_admin()
  )
  with check (
    id = (select public.current_influencer_id())
    or public.is_admin()
  );

-- Insert/delete yalnızca service_role (API). Authenticated insert yok.

drop policy if exists influencer_payout_accounts_select on public.influencer_payout_accounts;
create policy influencer_payout_accounts_select
  on public.influencer_payout_accounts
  for select to authenticated
  using (
    influencer_id = (select public.current_influencer_id())
    or public.is_admin()
  );

drop policy if exists influencer_payout_accounts_insert on public.influencer_payout_accounts;
create policy influencer_payout_accounts_insert
  on public.influencer_payout_accounts
  for insert to authenticated
  with check (influencer_id = (select public.current_influencer_id()));

drop policy if exists influencer_payout_accounts_update on public.influencer_payout_accounts;
create policy influencer_payout_accounts_update
  on public.influencer_payout_accounts
  for update to authenticated
  using (influencer_id = (select public.current_influencer_id()))
  with check (influencer_id = (select public.current_influencer_id()));

drop policy if exists influencer_earnings_select on public.influencer_earnings;
create policy influencer_earnings_select
  on public.influencer_earnings
  for select to authenticated
  using (
    influencer_id = (select public.current_influencer_id())
    or public.is_admin()
  );

drop policy if exists influencer_earnings_admin_update on public.influencer_earnings;
create policy influencer_earnings_admin_update
  on public.influencer_earnings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on table public.influencers from anon, public;
grant select, update on table public.influencers to authenticated;
grant all on table public.influencers to service_role;

revoke all on table public.influencer_payout_accounts from anon, public;
grant select, insert, update on table public.influencer_payout_accounts to authenticated;
grant all on table public.influencer_payout_accounts to service_role;

revoke all on table public.influencer_earnings from anon, public;
grant select, update on table public.influencer_earnings to authenticated;
grant all on table public.influencer_earnings to service_role;

comment on table public.influencers is
  'Influencer hesapları — ayrı panel, 1 kod. Üye/personel listesine düşmez.';
comment on table public.influencer_payout_accounts is
  'Influencer hakediş IBAN — influencers.data içinde tutulmaz.';
comment on table public.influencer_earnings is
  'Kodlu ilk Checkout hakedişi — service_role yazar, admin durum günceller.';
