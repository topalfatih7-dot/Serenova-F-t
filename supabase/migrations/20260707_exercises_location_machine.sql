-- 1600exercisedbpro konum + makine metadata (locations[], requires_machine)

alter table public.exercises add column if not exists locations text[] default '{}';
alter table public.exercises add column if not exists requires_machine boolean default false;

create index if not exists exercises_locations_gin_idx on public.exercises using gin (locations);
create index if not exists exercises_requires_machine_idx on public.exercises (requires_machine);
