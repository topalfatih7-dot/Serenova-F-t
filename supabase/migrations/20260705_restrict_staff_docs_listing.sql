-- Supabase linter: "Public Bucket Allows Listing" — staff-application-docs bucket'ında
-- herkese açık SELECT policy'si dosya listelemeye izin veriyordu (başvuru sahiplerinin
-- kimlik/sertifika belgelerinin enumerasyonu riski). Public bucket olduğu için tekil
-- dosyaya doğrudan public URL ile erişim bu politikadan etkilenmez (Supabase Storage
-- public bucket GET isteklerinde RLS'yi zaten atlar); yalnızca `list()` / toplu SELECT
-- admin ile sınırlanıyor.
drop policy if exists "staff app docs public read" on storage.objects;
create policy "staff app docs public read" on storage.objects
  for select using (bucket_id = 'staff-application-docs' and public.is_admin());
