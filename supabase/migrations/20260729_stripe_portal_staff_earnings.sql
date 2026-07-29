-- Stripe Customer Portal + staff hakediş (Faz 2–3)

-- ── members.stripe_customer_id ──────────────────────────────────────────────
alter table public.members
  add column if not exists stripe_customer_id text;

create unique index if not exists members_stripe_customer_id_uidx
  on public.members (stripe_customer_id)
  where stripe_customer_id is not null;

comment on column public.members.stripe_customer_id is
  'Stripe Customer id — Checkout/webhook yazar; Customer Portal için gerekli.';

-- Üye kendi satırında stripe_customer_id değiştiremesin
create or replace function public.enforce_member_stripe_customer_id()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  jwt_role text;
begin
  jwt_role := coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    auth.jwt() ->> 'role'
  );
  if jwt_role = 'service_role' or public.is_admin() then
    return new;
  end if;
  if tg_op = 'UPDATE' and new.stripe_customer_id is distinct from old.stripe_customer_id then
    new.stripe_customer_id := old.stripe_customer_id;
  end if;
  if tg_op = 'INSERT' and new.stripe_customer_id is not null and jwt_role is distinct from 'service_role' then
    new.stripe_customer_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_member_stripe_customer_id on public.members;
create trigger trg_enforce_member_stripe_customer_id
  before insert or update on public.members
  for each row
  execute function public.enforce_member_stripe_customer_id();

revoke all on function public.enforce_member_stripe_customer_id() from public;
revoke all on function public.enforce_member_stripe_customer_id() from anon, authenticated;
grant execute on function public.enforce_member_stripe_customer_id() to service_role;

-- ── staff_earnings ──────────────────────────────────────────────────────────
create table if not exists public.staff_earnings (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  session_id text not null,
  session_type text not null default 'coach_session',
  amount_try numeric(12, 2) not null default 500,
  overlap_minutes integer not null default 0,
  period_key text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'paid', 'reversed', 'rejected')),
  reject_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (staff_id, session_id)
);

create index if not exists staff_earnings_staff_id_idx on public.staff_earnings (staff_id);
create index if not exists staff_earnings_status_idx on public.staff_earnings (status);
create index if not exists staff_earnings_period_key_idx on public.staff_earnings (period_key);
create index if not exists staff_earnings_member_id_idx on public.staff_earnings (member_id);

alter table public.staff_earnings enable row level security;

-- Staff: kendi satırlarını okur
drop policy if exists staff_earnings_select_own on public.staff_earnings;
create policy staff_earnings_select_own on public.staff_earnings
  for select to authenticated
  using (
    staff_id = public.current_staff_id()
    or public.is_admin()
  );

-- Admin: güncelleme (onay / ödeme)
drop policy if exists staff_earnings_admin_update on public.staff_earnings;
create policy staff_earnings_admin_update on public.staff_earnings
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Admin: okuma zaten yukarıda; insert yalnızca service_role (API)
revoke all on public.staff_earnings from anon;
grant select on public.staff_earnings to authenticated;
grant update on public.staff_earnings to authenticated;
grant all on public.staff_earnings to service_role;

comment on table public.staff_earnings is
  'Video görüşme hakedişi — attendance billable olduğunda service_role yazar.';
