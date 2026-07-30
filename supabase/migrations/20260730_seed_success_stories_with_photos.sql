-- Profil fotoğraflı başarı hikâyeleri (landing /stories)
-- photo: public/success-stories/*.webp — onaylı vitrin içerik
-- Idempotent: sabit UUID + ON CONFLICT

DELETE FROM public.site_content
WHERE kind = 'success_story'
  AND (
    id IN (
      'b1000001-0000-4000-8000-000000000001',
      'b1000002-0000-4000-8000-000000000002',
      'b1000003-0000-4000-8000-000000000003'
    )
    OR data->>'name' IN ('Ayşe M.', 'Elif K.', 'Mehmet A.', 'Zeynep D.')
  );

INSERT INTO public.site_content (id, kind, sort, data) VALUES
(
  'b1000001-0000-4000-8000-000000000001',
  'success_story', 1,
  '{
    "name": "Elif K.",
    "duration": "12 hafta",
    "highlight": "Diyet paketi · düzenli öğün alışkanlığı",
    "story": "Sağlık testini tamamladıktan sonra diyetisyenim panele gerçek hayatıma uygun listeler gönderdi. Ofis öğle yemekleri ve sosyal akşamlar dahil. Takvimden öğünleri işaretledikçe ilerlemeyi net gördüm; 12 haftada enerji seviyem ve özgüvenim belirgin şekilde arttı.",
    "photo": "/success-stories/elif-k.webp",
    "consent": true,
    "approved": true
  }'::jsonb
),
(
  'b1000002-0000-4000-8000-000000000002',
  'success_story', 2,
  '{
    "name": "Mehmet A.",
    "duration": "16 hafta",
    "highlight": "Spor paketi · salon + ev programı",
    "story": "Yoğun iş temposunda antrenmanı sürdürmek zordu. Spor paketinde koçum haftalık programı panele işledi; salon günleri ve evde kısa seanslar birlikte planlandı. Video kütüphanesiyle hareketleri netleştirdim, görüşmelerde formumu düzelttik. 16 haftada düzeni kaybetmeden devam edebildim.",
    "photo": "/success-stories/mehmet-a.webp",
    "consent": true,
    "approved": true
  }'::jsonb
),
(
  'b1000003-0000-4000-8000-000000000003',
  'success_story', 3,
  '{
    "name": "Zeynep D.",
    "duration": "20 hafta",
    "highlight": "VIP · koç + diyetisyen birlikte",
    "story": "VIP pakette koç ve diyetisyenim aynı panelde notlarımı görüyor; program ve beslenme birbirini destekliyor. Sağlık skorlarımı dashboarddan takip ediyorum, randevuları video ile kaçırmadan tamamlıyorum. Sonuçlar kişiden kişiye değişir ama bütüncül destek benim için fark yarattı.",
    "photo": "/success-stories/zeynep-d.webp",
    "consent": true,
    "approved": true
  }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  kind = EXCLUDED.kind,
  sort = EXCLUDED.sort,
  data = EXCLUDED.data;
