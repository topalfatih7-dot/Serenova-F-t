-- Thumbnail'ler tek kare, hassas içerik değil: public bucket = CDN cache + sıfır imzalama maliyeti.
-- Videolar private kalmaya devam ediyor.
insert into storage.buckets (id, name, public)
values ('exercise-thumbs', 'exercise-thumbs', true)
on conflict (id) do update set public = true;

drop policy if exists "exercise thumbs public read" on storage.objects;
create policy "exercise thumbs public read"
  on storage.objects for select
  using (bucket_id = 'exercise-thumbs');

-- Yazma sadece service role (varsayılan; ek insert/update policy AÇMA).
