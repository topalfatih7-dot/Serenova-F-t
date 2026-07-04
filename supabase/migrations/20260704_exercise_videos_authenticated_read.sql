-- Giriş yapmış kullanicilar (uye/koc/admin) exercise-videos bucket'indaki
-- dosyalar icin client-side createSignedUrl kullanabilsin. Bucket private kalir;
-- kalici public URL yok, anonim erisim yok. Yukleme/silme hâlâ admin RLS ile.

drop policy if exists "exercise videos public read" on storage.objects;
drop policy if exists "exercise videos authenticated read" on storage.objects;

create policy "exercise videos authenticated read" on storage.objects
  for select using (
    bucket_id = 'exercise-videos'
    and auth.role() = 'authenticated'
  );
