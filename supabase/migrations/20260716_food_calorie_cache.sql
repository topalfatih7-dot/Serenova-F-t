-- Kalori AI token tasarrufu: global yiyecek sözlüğü + öğün analiz cache

create table if not exists public.food_dictionary (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_normalized text not null,
  cal_per_unit integer not null default 0 check (cal_per_unit >= 0),
  unit text not null default 'porsiyon',
  amount_default numeric(10, 2) not null default 1 check (amount_default > 0),
  source text not null default 'ai' check (source in ('ai', 'manual')),
  usage_count integer not null default 1 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists food_dictionary_name_norm_uidx
  on public.food_dictionary (name_normalized);

create index if not exists food_dictionary_usage_idx
  on public.food_dictionary (usage_count desc);

create table if not exists public.meal_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  query_normalized text not null,
  query_raw text not null default '',
  label text not null default '',
  items jsonb not null default '[]'::jsonb,
  confidence text not null default 'medium',
  hit_count integer not null default 1 check (hit_count >= 0),
  last_hit_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists meal_analysis_cache_query_norm_uidx
  on public.meal_analysis_cache (query_normalized);

create index if not exists meal_analysis_cache_hit_idx
  on public.meal_analysis_cache (hit_count desc, last_hit_at desc);

alter table public.food_dictionary enable row level security;
alter table public.meal_analysis_cache enable row level security;

revoke all on public.food_dictionary from public, anon, authenticated;
revoke all on public.meal_analysis_cache from public, anon, authenticated;

grant select on public.food_dictionary to authenticated;
grant select on public.meal_analysis_cache to authenticated;
grant all on public.food_dictionary to service_role;
grant all on public.meal_analysis_cache to service_role;

drop policy if exists food_dictionary_select on public.food_dictionary;
create policy food_dictionary_select
  on public.food_dictionary
  for select
  to authenticated
  using (true);

drop policy if exists meal_analysis_cache_select on public.meal_analysis_cache;
create policy meal_analysis_cache_select
  on public.meal_analysis_cache
  for select
  to authenticated
  using (true);

comment on table public.food_dictionary is
  'Global yiyecek kalori sözlüğü — AI sonuçlarından doldurulur; service_role yazar';

comment on table public.meal_analysis_cache is
  'Normalize öğün metni → tam analiz JSON cache; service_role yazar';
