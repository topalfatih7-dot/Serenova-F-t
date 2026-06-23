-- Kadro profili zenginleştirme + örnek blog yazıları (idempotent güncelleme)
-- staff.data JSONB şeması: title, specialty, specialties[], headline, bio, education[], experienceYears, experiences[], certificates[], languages[]

-- Mevcut koç profili (Ahmet)
UPDATE public.staff
SET
  name = 'Ahmet Yılmaz',
  data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
    'phone', coalesce(data->>'phone', '+90 532 000 00 01'),
    'title', 'Uzman Fitness Koçu',
    'specialty', 'Fonksiyonel Antrenman & Vücut Kompozisyonu',
    'specialties', jsonb_build_array('Fonksiyonel antrenman', 'Vücut kompozisyonu', 'Kuvvet geliştirme', 'Mobilite'),
    'headline', 'Bilim temelli antrenmanla sürdürülebilir güç ve form kazanın.',
    'bio', '10 yılı aşkın deneyimiyle bireysel ve online koçluk alanında çalışan Ahmet, hareket kalitesi ve sürdürülebilir alışkanlıklara odaklanır. Amatör sporculardan yoğun çalışan profesyonellere kadar farklı profillere ölçülebilir hedefler koyar; her programı üyenin yaşam temposuna göre uyarlar.',
    'education', jsonb_build_array(
      jsonb_build_object('degree', 'Spor Bilimleri Lisans', 'school', 'Ege Üniversitesi', 'year', '2014'),
      jsonb_build_object('degree', 'Personal Training Sertifikası', 'school', 'ACE / Uluslararası Akreditasyon', 'year', '2016')
    ),
    'experienceYears', 10,
    'experiences', jsonb_build_array(
      jsonb_build_object('title', 'Baş Fitness Koçu', 'organization', 'Özel Spor Merkezi', 'period', '2018 – Günümüz', 'description', 'Birebir ve online koçluk, vücut kompozisyonu odaklı program tasarımı.'),
      jsonb_build_object('title', 'Kuvvet & Kondisyon Koçu', 'organization', 'Amatör Spor Kulübü', 'period', '2014 – 2018', 'description', 'Periyodizasyon ve sakatlık önleme protokolleri.')
    ),
    'certificates', jsonb_build_array(
      jsonb_build_object('name', 'NASM Certified Personal Trainer', 'issuer', 'NASM', 'year', '2016'),
      jsonb_build_object('name', 'Fonksiyonel Hareket Ekranı (FMS)', 'issuer', 'FMS', 'year', '2019'),
      jsonb_build_object('name', 'TRX Suspension Training', 'issuer', 'TRX', 'year', '2020')
    ),
    'languages', jsonb_build_array('Türkçe', 'İngilizce'),
    'workDays', coalesce(data->'workDays', '[1,2,3,4,5]'::jsonb),
    'workStart', coalesce(data->>'workStart', '09:00'),
    'workEnd', coalesce(data->>'workEnd', '18:00')
  )
WHERE id = 'b5ba07fe-9c43-46c7-a146-86d5c6b3b336'
   OR (role = 'coach' AND active = true AND NOT EXISTS (
     SELECT 1 FROM public.staff s2 WHERE s2.id = 'b5ba07fe-9c43-46c7-a146-86d5c6b3b336'
   ));

-- Mevcut diyetisyen profili
UPDATE public.staff
SET
  name = 'Dr. Elif Kaya',
  data = coalesce(data, '{}'::jsonb) || jsonb_build_object(
    'phone', coalesce(data->>'phone', '+90 532 000 00 02'),
    'title', 'Uzman Diyetisyen',
    'specialty', 'Spor Beslenmesi & Metabolik Sağlık',
    'specialties', jsonb_build_array('Spor beslenmesi', 'Kilo yönetimi', 'Metabolik sağlık', 'Duygusal yeme'),
    'headline', 'Sürdürülebilir beslenme alışkanlıklarıyla enerjinizi ve performansınızı yükseltin.',
    'bio', 'Klinik ve spor beslenmesi alanında uzmanlaşan Elif, kısıtlayıcı diyetler yerine yaşam tarzına uyumlu beslenme planları oluşturur. Online görüşmelerde günlük rutin, alışveriş ve sosyal yaşamı hesaba katar; hedefleri ölçülebilir adımlarla takip eder.',
    'education', jsonb_build_array(
      jsonb_build_object('degree', 'Beslenme ve Diyetetik Lisans', 'school', 'Hacettepe Üniversitesi', 'year', '2015'),
      jsonb_build_object('degree', 'Spor Beslenmesi Yüksek Lisans', 'school', 'Ankara Üniversitesi', 'year', '2018')
    ),
    'experienceYears', 8,
    'experiences', jsonb_build_array(
      jsonb_build_object('title', 'Klinik Diyetisyen', 'organization', 'Özel Hastane Beslenme Birimi', 'period', '2018 – 2022', 'description', 'Metabolik sendrom, kilo yönetimi ve sporcu beslenmesi.'),
      jsonb_build_object('title', 'Online Diyetisyen', 'organization', 'Yeni Form', 'period', '2022 – Günümüz', 'description', 'Kişiselleştirilmiş beslenme programları ve haftalık takip.')
    ),
    'certificates', jsonb_build_array(
      jsonb_build_object('name', 'Spor Beslenmesi Uzmanlık Sertifikası', 'issuer', 'Türkiye Diyetisyenler Derneği', 'year', '2019'),
      jsonb_build_object('name', 'Duygusal Yeme ve Davranışsal Beslenme', 'issuer', 'Uluslararası Beslenme Akademisi', 'year', '2021')
    ),
    'languages', jsonb_build_array('Türkçe', 'İngilizce'),
    'workDays', coalesce(data->'workDays', '[1,2,3,4,5]'::jsonb),
    'workStart', coalesce(data->>'workStart', '10:00'),
    'workEnd', coalesce(data->>'workEnd', '19:00')
  )
WHERE id = '10aea371-d7a1-43bd-bf02-10927d127396'
   OR (role = 'dietitian' AND active = true AND NOT EXISTS (
     SELECT 1 FROM public.staff s2 WHERE s2.id = '10aea371-d7a1-43bd-bf02-10927d127396'
   ));

-- Eski test / kısa blog yazılarını kaldır, 5 kaliteli yazı ekle
DELETE FROM public.posts;

INSERT INTO public.posts (id, published, data, created_at) VALUES
(
  'b1000001-0000-4000-8000-000000000001',
  true,
  jsonb_build_object(
    'title', 'Sürdürülebilir Dönüşümün 5 Temel İlkesi',
    'category', 'Motivasyon',
    'excerpt', 'Kalıcı değişim radikal diyetlerle değil, küçük ve tutarlı adımlarla gelir. İşte yolculuğunuzu sürdürülebilir kılacak beş ilke.',
    'author', 'Yeni Form Ekibi',
    'readMinutes', 4,
    'accent', 'brand',
    'content', E'Dönüşüm denince çoğu kişinin aklına birkaç haftalık yoğun bir program gelir. Oysa gerçek ve kalıcı değişim, sürdürülebilir alışkanlıkların zaman içinde birikmesiyle oluşur.\n\n1. Küçük başlayın\nHedefinizi gözünüzde büyütmeyin. Haftada üç gün 20 dakikalık yürüyüş bile, hiç hareket etmemekten kat kat değerlidir.\n\n2. Ölçün ve takip edin\nİlerlemenizi görmek motivasyonun en güçlü kaynağıdır. Kilonuzu, enerji seviyenizi ve ruh halinizi düzenli kaydedin.\n\n3. Esneklik tanıyın\nMükemmeliyetçilik dönüşümün en büyük düşmanıdır. Bir gün programı kaçırmanız her şeyi mahvetmez.\n\n4. Destek alın\nYalnız yürünen yol uzundur. Bir koç, diyetisyen veya destekleyici bir topluluk zor günlerde sizi ayakta tutar.\n\n5. Süreci sevin\nSadece sonuca değil, yolculuğun kendisine odaklanın.\n\nUnutmayın: Yeni Form bir wellness ve koçluk platformudur, tıbbi tedavi sunmaz.',
    'createdAt', '2026-05-02',
    'updatedAt', '2026-06-23'
  ),
  '2026-05-02 10:00:00+00'
),
(
  'b1000002-0000-4000-8000-000000000002',
  true,
  jsonb_build_object(
    'title', 'Protein Hakkında Bilmeniz Gereken Her Şey',
    'category', 'Beslenme',
    'excerpt', 'Ne kadar protein almalısınız, hangi kaynaklar daha iyi ve öğünlere nasıl dağıtmalısınız?',
    'author', 'Dr. Elif Kaya',
    'readMinutes', 5,
    'accent', 'sage',
    'content', E'Protein, kasların onarımından bağışıklık sistemine kadar vücudun pek çok temel işlevinde rol oynar.\n\nNe kadar protein?\nGenel sağlıklı yetişkinler için günlük 0,8–1,2 g/kg aralığı yaygın bir öneridir. Düzenli antrenman yapanlarda bu miktar artabilir.\n\nKaliteli kaynaklar\nYumurta, yoğurt, baklagiller, tavuk, balık ve mercimek gibi besinler hem protein hem de değerli mikro besinler sağlar.\n\nÖğünlere dağıtın\nTüm proteini tek öğünde almak yerine gün içine yaymak daha etkilidir.\n\nBu içerik genel bilgilendirme amaçlıdır; bireysel plan için diyetisyeninize danışın.',
    'createdAt', '2026-05-10',
    'updatedAt', '2026-06-23'
  ),
  '2026-05-10 10:00:00+00'
),
(
  'b1000003-0000-4000-8000-000000000003',
  true,
  jsonb_build_object(
    'title', 'Evde Ekipmansız Başlangıç Antrenmanı',
    'category', 'Antrenman',
    'excerpt', 'Spor salonuna gitmeden, kendi vücut ağırlığınızla güç ve dayanıklılık kazanabilirsiniz.',
    'author', 'Ahmet Yılmaz',
    'readMinutes', 3,
    'accent', 'gold',
    'content', E'Antrenmana başlamak için pahalı ekipmanlara ihtiyacınız yok.\n\nIsınma (5 dakika)\nYerinde yürüyüş, kol çevirme ve hafif squat ile başlayın.\n\nTemel devre (2–3 tur)\n• Squat — 12 tekrar\n• Diz üstü şınav — 8 tekrar\n• Köprü — 15 tekrar\n• Plank — 20 saniye\n\nSoğuma\nBitirdikten sonra birkaç dakika esneme yapın. Keskin ağrı hissederseniz durun.',
    'createdAt', '2026-05-18',
    'updatedAt', '2026-06-23'
  ),
  '2026-05-18 10:00:00+00'
),
(
  'b1000004-0000-4000-8000-000000000004',
  true,
  jsonb_build_object(
    'title', 'Uyku: Görmezden Gelinen Sağlık Süper Gücü',
    'category', 'Yaşam',
    'excerpt', 'İyi bir uyku; iştahtan enerjiye, ruh halinden toparlanmaya kadar her şeyi etkiler.',
    'author', 'Yeni Form Ekibi',
    'readMinutes', 4,
    'accent', 'brand',
    'content', E'Beslenme ve egzersiz kadar önemli olmasına rağmen uyku çoğu zaman göz ardı edilir.\n\nDaha iyi uyku için\n• Her gün aynı saatte yatıp kalkmaya çalışın.\n• Yatmadan en az bir saat önce ekranları bırakın.\n• Yatak odanızı serin, karanlık ve sessiz tutun.\n• Akşam geç saatlerde kafein ve ağır öğünlerden kaçının.\n\nSürekli uyku sorunları yaşıyorsanız bir sağlık profesyoneline danışın.',
    'createdAt', '2026-05-27',
    'updatedAt', '2026-06-23'
  ),
  '2026-05-27 10:00:00+00'
),
(
  'b1000005-0000-4000-8000-000000000005',
  true,
  jsonb_build_object(
    'title', 'Online Koçluk ve Diyetisyen Desteği Neden İşe Yarar?',
    'category', 'Yaşam',
    'excerpt', 'Online destek; esnek randevu, kişisel program takibi ve sürdürülebilir alışkanlıklar için güçlü bir model sunar.',
    'author', 'Yeni Form Ekibi',
    'readMinutes', 5,
    'accent', 'sage',
    'content', E'Online wellness desteği, doğru kurgulandığında yüz yüze danışmanlıkla aynı disiplini daha erişilebilir bir forma taşır.\n\nEsneklik ve süreklilik\nYoğun iş temposu yüz yüze görüşmeleri zorlaştırabilir. Video görüşme randevuları programınıza devam etmenizi sağlar.\n\nKişisel program takibi\nÜye panelinizde antrenman ve beslenme programlarınızı görebilir, ilerlemenizi takip edebilirsiniz.\n\nYeni Form farkı\nBasic paketle ücretsiz başlayabilir; üst paketlerde koç ve diyetisyen desteği sunulur. Platform tıbbi tedavi sunmaz; özel sağlık durumlarında doktorunuza danışın.',
    'createdAt', '2026-06-10',
    'updatedAt', '2026-06-23'
  ),
  '2026-06-10 10:00:00+00'
);
