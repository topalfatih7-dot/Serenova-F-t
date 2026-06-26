-- Kadro başvuru belgeleri (sertifika scan/PDF)
insert into storage.buckets (id, name, public)
values ('staff-application-docs', 'staff-application-docs', true)
on conflict (id) do nothing;

drop policy if exists "staff app docs public read" on storage.objects;
create policy "staff app docs public read" on storage.objects
  for select using (bucket_id = 'staff-application-docs');

drop policy if exists "staff app docs anon insert" on storage.objects;
create policy "staff app docs anon insert" on storage.objects
  for insert with check (bucket_id = 'staff-application-docs');

drop policy if exists "staff app docs admin delete" on storage.objects;
create policy "staff app docs admin delete" on storage.objects
  for delete using (bucket_id = 'staff-application-docs' and public.is_admin());
