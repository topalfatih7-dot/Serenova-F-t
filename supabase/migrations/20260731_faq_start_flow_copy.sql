-- SSS: “Hangi paketlerle başlayabilirim?” — ücretsiz başla → paket seç → devam et akışı

UPDATE public.site_content
SET data = jsonb_build_object(
  'q', 'Hangi paketlerle başlayabilirim?',
  'a', 'Tamamen ücretsiz başlayın, paneli keşfedin. Hedefinize uygun paketi — Eko Diyet, Diyet, Eko Spor, Spor, Doktor veya VIP — seçerek yolculuğunuza devam edin. Programlarınız koç ve diyetisyen tarafından hazırlanır; ödemeler Stripe ile güvenle alınır, aboneliğinizi dilediğiniz an yönetebilirsiniz.'
)
WHERE id = 'f1000002-0000-4000-8000-000000000002';
