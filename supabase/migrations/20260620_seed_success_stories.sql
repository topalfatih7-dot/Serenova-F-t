-- Demo başarı hikayeleri kaldırıldı; gerçek içerik admin panelinden eklenir.
-- Eski kurulumlarda kalan demo kayıtları temizlenir.

delete from public.site_content
where kind = 'success_story'
  and data->>'name' in ('Mehmet Y.', 'Elif K.', 'Zeynep A.', 'Can D.');
