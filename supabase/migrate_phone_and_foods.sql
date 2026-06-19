-- ============================================================================
-- Migration: Telefon kolonu + Topluluk Besin Veritabanı (custom_foods)
-- Supabase SQL Editor'da bu dosyanın TAMAMINI çalıştırın. Tekrar çalıştırmak güvenlidir.
-- ============================================================================

-- 1) members.phone — telefonu görünür bir kolona taşı (eskiden data JSONB içindeydi)
alter table public.members
  add column if not exists phone text not null default '';

-- Mevcut üyelerin data->>'phone' değerini kolona taşı (backfill)
update public.members
  set phone = coalesce(data->>'phone', '')
  where (phone is null or phone = '')
    and data ? 'phone';

-- ============================================================================
-- 2) custom_foods — kullanıcıların eklediği besinler (topluluk havuzu)
--    Bir kez eklenen besin herkes için anında kullanılabilir; AI'ya tekrar gidilmez.
-- ============================================================================
create table if not exists public.custom_foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text not null,          -- aramada hız + tekilleştirme için
  category text not null default 'Diğer',
  cal100 integer not null,                 -- 100 gram başına kalori
  unit text not null default 'porsiyon',   -- varsayılan ölçü birimi
  unit_g integer not null default 100,     -- 1 birim kaç gram
  source text not null default 'ai',       -- 'ai' | 'user' | 'admin'
  created_by uuid references auth.users(id) on delete set null,
  usage_count integer not null default 1,  -- popülerlik (sık kullanılan üste)
  created_at timestamptz not null default now()
);

-- Aynı besin iki kez eklenmesin (normalize edilmiş isim benzersiz)
create unique index if not exists custom_foods_name_norm_idx
  on public.custom_foods (name_normalized);

create index if not exists custom_foods_usage_idx
  on public.custom_foods (usage_count desc);

-- RLS: giriş yapan herkes okuyabilir ve ekleyebilir (topluluk havuzu).
alter table public.custom_foods enable row level security;

drop policy if exists "custom_foods_read" on public.custom_foods;
create policy "custom_foods_read"
  on public.custom_foods for select
  to authenticated
  using (true);

drop policy if exists "custom_foods_insert" on public.custom_foods;
create policy "custom_foods_insert"
  on public.custom_foods for insert
  to authenticated
  with check (true);

drop policy if exists "custom_foods_update" on public.custom_foods;
create policy "custom_foods_update"
  on public.custom_foods for update
  to authenticated
  using (true)
  with check (true);

-- Kullanım sayacını güvenli şekilde artıran yardımcı (yarış koşulu olmadan)
create or replace function public.increment_food_usage(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.custom_foods set usage_count = usage_count + 1 where id = p_id;
$$;
