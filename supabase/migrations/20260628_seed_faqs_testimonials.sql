-- SSS ve üye yorumları — ana sayfa SSS + TestimonialCarousel için vitrin içeriği
-- Idempotent: sabit UUID ile tekrar çalıştırılabilir

-- Önceki demo/boş kayıtları temizle (yalnızca bu seed setine ait id'ler değil — tüm faq/testimonial)
DELETE FROM public.site_content WHERE kind IN ('faq', 'testimonial');

-- ── SSS (7 soru) ──
INSERT INTO public.site_content (id, kind, sort, data) VALUES
(
  'f1000001-0000-4000-8000-000000000001',
  'faq', 1,
  '{"q":"Yeni Form nedir, kimler için uygundur?","a":"Yeni Form; kişisel sağlık analizi, uzman koç ve diyetisyen desteği, beslenme ve antrenman programları ile video görüşme randevularını tek panelde sunan çevrimiçi bir wellness platformudur. Evde veya spor salonunda antrenman yapan, hedeflerine rehberlikle ulaşmak isteyen herkes için uygundur. Tıbbi tedavi veya teşhis hizmeti sunmaz."}'::jsonb
),
(
  'f1000002-0000-4000-8000-000000000002',
  'faq', 2,
  '{"q":"Ücretsiz Basic paketle neler yapabilirim?","a":"Basic paket tamamen ücretsizdir ve kredi kartı gerektirmez. Kayıt sonrası sağlık testinizi tamamlayarak size özel otomatik program alır, takvimden ilerlemenizi takip eder ve video kütüphanesine erişirsiniz. Koç veya diyetisyen görüşmesi ücretli paketlerde sunulur."}'::jsonb
),
(
  'f1000003-0000-4000-8000-000000000003',
  'faq', 3,
  '{"q":"Koç ve diyetisyen desteği nasıl işler?","a":"Ücretli paketlerde size atanmış koç ve/veya diyetisyeniniz panel üzerinden program hazırlar, haftalık görüşme randevuları planlar ve ilerlemenizi takip eder. Görüşmeler Daily.co altyapısıyla güvenli video bağlantı üzerinden yapılır; randevu saatinde panelinizden tek tıkla katılırsınız."}'::jsonb
),
(
  'f1000004-0000-4000-8000-000000000004',
  'faq', 4,
  '{"q":"Evde mi yoksa spor salonunda mı antrenman yapabilirim?","a":"Her iki seçenek de desteklenir. Koçunuz hedeflerinize, ekipman erişiminize ve yaşam tarzınıza göre evde veya salon ortamına uygun program hazırlar. Programınızı panelden görüntüler, videolarla hareket tekniklerini öğrenir ve tamamladıkça işaretlersiniz."}'::jsonb
),
(
  'f1000006-0000-4000-8000-000000000006',
  'faq', 5,
  '{"q":"Kişisel sağlık verilerim güvende mi?","a":"Evet. Verileriniz KVKK kapsamında işlenir; uçtan uca şifreli altyapıda saklanır ve üçüncü taraflarla paylaşılmaz. Aydınlatma metnimizi /kvkk sayfasından, gizlilik politikamızı /privacy adresinden inceleyebilirsiniz."}'::jsonb
),
(
  'f1000007-0000-4000-8000-000000000007',
  'faq', 6,
  '{"q":"Kurumsal wellness programınız var mı?","a":"Evet. Şirketler için ölçeklenebilir koçluk, beslenme danışmanlığı ve çalışan wellness çözümleri sunuyoruz. /corporate sayfasından program detaylarını inceleyebilir, /corporate/apply üzerinden ekibimizin size özel teklif hazırlaması için başvuru yapabilirsiniz."}'::jsonb
),
(
  'f1000008-0000-4000-8000-000000000008',
  'faq', 7,
  '{"q":"Kalori hesaplama ve yapay zeka özellikleri kimler içindir?","a":"Temel kalori takibi Basic üyeler için sınırlı olarak kullanılabilir. Fotoğraflı öğün analizi ve gelişmiş yapay zeka destekli beslenme özellikleri Platinum ve üzeri paketlerde sunulur. Paket karşılaştırması için /membership sayfasını ziyaret edin."}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, sort = EXCLUDED.sort, data = EXCLUDED.data;

-- ── Üye yorumları (6 yorum) ──
INSERT INTO public.site_content (id, kind, sort, data) VALUES
(
  'e1000001-0000-4000-8000-000000000001',
  'testimonial', 1,
  '{"name":"Elif Kaya","role":"Kurucu Üye · 4 ay","quote":"Spor salonuna gidiyorum ama programı kafamda kuramıyordum. Koçum haftalık planı panele işliyor, görüşmelerde formumu düzeltiyor. Evde yoga günlerim de programa eklendi — gerçekten kişiye özel hissettiriyor.","rating":5}'::jsonb
),
(
  'e1000002-0000-4000-8000-000000000002',
  'testimonial', 2,
  '{"name":"Mehmet Arslan","role":"Spor Paketi · 6 ay","quote":"Yoğun iş temposunda antrenmanı sürdürmek zordu. Yeni Form''daki hatırlatıcılar ve koç mesajları sayesinde düzeni korudum. Salon programım telefondan takip ediliyor, kaçırdığım görüşmeyi bile telafi edebildik.","rating":5}'::jsonb
),
(
  'e1000003-0000-4000-8000-000000000003',
  'testimonial', 3,
  '{"name":"Zeynep Demir","role":"Diyet Paketi · 3 ay","quote":"Diyetisyenim öğün planlarını gerçek hayatıma göre ayarladı — ofis yemekleri, sosyal davetler dahil. Sadece liste vermekle kalmadı, neden-sonuç ilişkisini anlattı. 3 ayda enerji seviyem belirgin şekilde arttı.","rating":5}'::jsonb
),
(
  'e1000004-0000-4000-8000-000000000004',
  'testimonial', 4,
  '{"name":"Can Öztürk","role":"Eko Paket · 2 ay","quote":"Ücretsiz paketle başladım, sonra Eko''ya geçtim. Evde dumbbell ile antrenman yapıyorum; videolar net, program anlaşılır. Fiyat-performans olarak beklentimin üzerinde bir deneyim oldu.","rating":5}'::jsonb
),
(
  'e1000005-0000-4000-8000-000000000005',
  'testimonial', 5,
  '{"name":"Ayşe Yılmaz","role":"VIP Üye · 8 ay","quote":"Hem koç hem diyetisyen desteği alıyorum. İkisi panelde birbirinin notlarını görüyor, bu bütüncül yaklaşım fark yaratıyor. Video görüşmeler sorunsuz; randevu hatırlatmaları çok işime yarıyor.","rating":5}'::jsonb
),
(
  'e1000006-0000-4000-8000-000000000006',
  'testimonial', 6,
  '{"name":"Burak Şahin","role":"Basic → Spor Paketi","quote":"Başlangıçta sadece denemek istedim, Basic paket ikna etti. Sonra salon üyeliğimle birlikte Spor paketine yükselttim. Platform sade, Türkçe destek hızlı — özellikle mobilde kullanımı rahat.","rating":4}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, sort = EXCLUDED.sort, data = EXCLUDED.data;
