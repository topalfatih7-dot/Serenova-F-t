-- Kalori boru hattı: ambalajlı ürün (OFF) + USDA arama cache
-- Yazma yalnızca service_role; Data API'de authenticated/anon yok.

create table if not exists public.product_nutrition_cache (
  barcode text primary key,
  product_name text,
  nutriments jsonb not null default '{}'::jsonb,
  serving_size text,
  serving_quantity numeric(10, 2),
  raw jsonb not null default '{}'::jsonb,
  source text not null default 'open_food_facts',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.usda_food_cache (
  query_normalized text primary key,
  fdc_id integer,
  description text,
  per_100g jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.product_nutrition_cache enable row level security;
alter table public.usda_food_cache enable row level security;

revoke all on public.product_nutrition_cache from public, anon, authenticated;
revoke all on public.usda_food_cache from public, anon, authenticated;

grant all on public.product_nutrition_cache to service_role;
grant all on public.usda_food_cache to service_role;

comment on table public.product_nutrition_cache is
  'Open Food Facts barkod → 100g besin; service_role yazar';
comment on table public.usda_food_cache is
  'USDA FDC arama cache (query_normalized); service_role yazar';
