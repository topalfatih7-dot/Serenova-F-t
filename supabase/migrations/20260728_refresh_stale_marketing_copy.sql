-- AI / Basic / ücretsiz kayıt kaldırma sonrası eski FAQ, testimonial ve blog metinlerini güncelle.

UPDATE public.site_content
SET data = jsonb_build_object(
  'q', 'Hangi paketlerle başlayabilirim?',
  'a', 'Diyet, Spor, Doktor veya VIP paketlerinden birini seçerek Stripe ile kayıt olabilirsiniz. Antrenman ve beslenme programları koç / diyetisyen tarafından hazırlanır; takvim ve video kütüphanesi panelinizde yer alır.'
)
WHERE id = 'f1000002-0000-4000-8000-000000000002';

UPDATE public.site_content
SET data = jsonb_build_object(
  'q', 'Kalori hesaplama ve yapay zeka özellikleri kimler içindir?',
  'a', 'Manuel (metin) kalori analizi Diyet, Spor ve VIP paketlerinde; fotoğraflı öğün analizi aynı paketlerde sunulur. Doktor ve paketsiz (süre bitmiş) üyelikte kalori AI kapalıdır. Karşılaştırma için /membership sayfasını ziyaret edin.'
)
WHERE id = 'f1000008-0000-4000-8000-000000000008';

UPDATE public.site_content
SET data = jsonb_build_object(
  'name', 'Can Öztürk',
  'role', 'Spor Paketi · 2 ay',
  'quote', 'Evde dumbbell ile antrenman yapıyorum; koçumun videoları net, program anlaşılır. Fiyat-performans olarak beklentimin üzerinde bir deneyim oldu.',
  'rating', 5
)
WHERE id = 'e1000004-0000-4000-8000-000000000004';

UPDATE public.site_content
SET data = jsonb_build_object(
  'name', 'Burak Şahin',
  'role', 'Spor Paketi · 5 ay',
  'quote', 'Salon üyeliğimle birlikte Spor paketine geçtim. Platform sade, Türkçe destek hızlı — özellikle mobilde kullanımı rahat.',
  'rating', 4
)
WHERE id = 'e1000006-0000-4000-8000-000000000006';

UPDATE public.site_content
SET data = jsonb_build_object(
  'name', 'Elif Kaya',
  'role', 'VIP Üye · 4 ay',
  'quote', 'Spor salonuna gidiyorum ama programı kafamda kuramıyordum. Koçum haftalık planı panele işliyor, görüşmelerde formumu düzeltiyor. Evde yoga günlerim de programa eklendi — gerçekten kişiye özel hissettiriyor.',
  'rating', 5
)
WHERE id = 'e1000001-0000-4000-8000-000000000001';

UPDATE public.posts
SET data = jsonb_set(
  data,
  '{content}',
  to_jsonb(
    replace(
      replace(
        data->>'content',
        'Basic paketle ücretsiz başlayabilir; Diyet ve Spor paketlerinde uzman görüşmeleri, Kurucu ve VIP paketlerde kapsamlı destek sunulur.',
        'Diyet ve Spor paketlerinde uzman görüşmeleri; VIP pakette koç ve diyetisyen desteği bir arada sunulur.'
      ),
      'Basic paketle ücretsiz başlayabilir; üst paketlerde koç ve diyetisyen desteği sunulur.',
      'Diyet, Spor veya VIP paketleriyle koç ve diyetisyen desteği sunulur.'
    )::text
  )
)
WHERE coalesce(data->>'content', '') ILIKE '%Basic paketle%';
