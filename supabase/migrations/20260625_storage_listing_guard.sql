-- exercise-videos: dosya listeleme riskini azalt (yalnızca admin listeler)
drop policy if exists "exercise videos public read" on storage.objects;
create policy "exercise videos public read" on storage.objects
  for select using (
    bucket_id = 'exercise-videos'
    and (
      public.is_admin()
      or owner = auth.uid()
    )
  );

-- Doğrudan public URL erişimi bucket public=true ile devam eder; API listeleme kısıtlandı
