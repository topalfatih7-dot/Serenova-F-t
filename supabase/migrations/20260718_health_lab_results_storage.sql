-- Üye kan tahlili / lab sonucu dosyaları (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'health-lab-results',
  'health-lab-results',
  false,
  8388608,
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: {auth.uid()}/filename
drop policy if exists "health lab results select own" on storage.objects;
create policy "health lab results select own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'health-lab-results'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "health lab results insert own" on storage.objects;
create policy "health lab results insert own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'health-lab-results'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "health lab results update own" on storage.objects;
create policy "health lab results update own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'health-lab-results'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'health-lab-results'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "health lab results delete own" on storage.objects;
create policy "health lab results delete own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'health-lab-results'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

drop policy if exists "health lab results admin all" on storage.objects;
create policy "health lab results admin all" on storage.objects
  for all to authenticated
  using (bucket_id = 'health-lab-results' and public.is_admin())
  with check (bucket_id = 'health-lab-results' and public.is_admin());
