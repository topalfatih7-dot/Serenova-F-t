-- 1600exercisedbpro import icin zengin metadata kolonlari.
-- video_url yalnizca storage path tutar (ornek: gym100-0001.mp4); kalici public URL yok.

alter table public.exercises add column if not exists source_pack text;
alter table public.exercises add column if not exists source_id text;
alter table public.exercises add column if not exists equipment text default '';
alter table public.exercises add column if not exists target_muscle text default '';
alter table public.exercises add column if not exists secondary_muscles text[] default '{}';
alter table public.exercises add column if not exists difficulty text default 'beginner';
alter table public.exercises add column if not exists movement_category text default 'strength';
alter table public.exercises add column if not exists instructions jsonb default '[]'::jsonb;
alter table public.exercises add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.exercises add column if not exists video_pending boolean default false;

-- Upsert (ON CONFLICT) icin tam constraint — partial index yeterli degil
alter table public.exercises drop constraint if exists exercises_source_pack_id_unique;
alter table public.exercises
  add constraint exercises_source_pack_id_unique unique (source_pack, source_id);

create index if not exists exercises_category_idx on public.exercises (category);
create index if not exists exercises_difficulty_idx on public.exercises (difficulty);
create index if not exists exercises_equipment_idx on public.exercises (equipment);
create index if not exists exercises_video_pending_idx on public.exercises (video_pending)
  where video_pending = true;
