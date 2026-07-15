-- YZ (AI) kullanım ve maliyet logları — admin paneli "YZ Gider" raporu

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  provider text not null,
  model text not null default '',
  endpoint text not null default '',
  user_id uuid references auth.users (id) on delete set null,
  prompt_tokens integer not null default 0 check (prompt_tokens >= 0),
  completion_tokens integer not null default 0 check (completion_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  cost_usd numeric(12, 6) not null default 0 check (cost_usd >= 0),
  success boolean not null default true,
  error_code text,
  meta jsonb
);

create index if not exists idx_ai_usage_logs_created_at
  on public.ai_usage_logs (created_at desc);

create index if not exists idx_ai_usage_logs_endpoint_created
  on public.ai_usage_logs (endpoint, created_at desc);

create index if not exists idx_ai_usage_logs_provider_created
  on public.ai_usage_logs (provider, created_at desc);

alter table public.ai_usage_logs enable row level security;

revoke all on public.ai_usage_logs from public, anon, authenticated;
grant select on public.ai_usage_logs to authenticated;
grant all on public.ai_usage_logs to service_role;

drop policy if exists ai_usage_logs_admin_select on public.ai_usage_logs;
create policy ai_usage_logs_admin_select
  on public.ai_usage_logs
  for select
  to authenticated
  using (public.is_admin());

comment on table public.ai_usage_logs is
  'AI API çağrıları — token ve tahmini USD maliyet; yalnızca admin okur, yazım service_role';
