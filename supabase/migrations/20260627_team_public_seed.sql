-- Kadro vitrin profilleri: public/team görselleri ile 4 uzman (idempotent)
-- Koç: team-coach-1.png, team-coach-2.png
-- Diyetisyen: team-dietitian-1.png, team-dietitian-2.png

INSERT INTO public.staff (id, email, name, role, active, data)
VALUES
(
  'b5ba07fe-9c43-46c7-a146-86d5c6b3b336',
  'ahmet.yilmaz@yeniform.com',
  'Ahmet Yılmaz',
  'coach',
  true,
  jsonb_build_object(
    'phone', '+90 532 000 00 01',
    'title', 'Uzman Fitness Koçu',
    'specialty', 'Fonksiyonel Antrenman & Vücut Kompozisyonu',
    'specialties', jsonb_build_array('Fonksiyonel antrenman', 'Vücut kompozisyonu', 'Kuvvet geliştirme', 'Mobilite'),
    'headline', 'Bilim temelli antrenmanla sürdürülebilir güç ve form kazanın.',
    'bio', '10 yılı aşkın deneyimiyle bireysel ve online koçluk alanında çalışan Ahmet, hareket kalitesi ve sürdürülebilir alışkanlıklara odaklanır.',
    'photo', '/team/team-coach-1.png',
    'city', 'İzmir',
    'district', 'Konak',
    'gender', 'male',
    'experienceYears', 10,
    'languages', jsonb_build_array('Türkçe', 'İngilizce'),
    'education', jsonb_build_array(jsonb_build_object('degree', 'Spor Bilimleri Lisans', 'school', 'Ege Üniversitesi', 'year', '2014')),
    'certificates', jsonb_build_array(
      jsonb_build_object('name', 'NASM Certified Personal Trainer', 'issuer', 'NASM', 'year', '2016'),
      jsonb_build_object('name', 'Fonksiyonel Hareket Ekranı (FMS)', 'issuer', 'FMS', 'year', '2019')
    ),
    'workDays', '[1,2,3,4,5]'::jsonb,
    'workStart', '09:00',
    'workEnd', '18:00'
  )
),
(
  'c6cb18fe-0d54-47d8-b257-97e6d7c4c447',
  'mert.demir@yeniform.com',
  'Mert Demir',
  'coach',
  true,
  jsonb_build_object(
    'phone', '+90 532 000 00 03',
    'title', 'Performans Koçu',
    'specialty', 'Kuvvet Antrenmanı & Sporcu Performansı',
    'specialties', jsonb_build_array('Kuvvet antrenmanı', 'HIIT', 'Sporcu performansı', 'Online koçluk'),
    'headline', 'Hedef odaklı programlarla performansınızı bir üst seviyeye taşıyın.',
    'bio', 'Amatör ve rekreatif sporcularla çalışan Mert, periodize antrenman planları ve mobilite çalışmalarıyla sürdürülebilir gelişim sağlar.',
    'photo', '/team/team-coach-2.png',
    'city', 'İstanbul',
    'district', 'Kadıköy',
    'gender', 'male',
    'experienceYears', 7,
    'languages', jsonb_build_array('Türkçe'),
    'education', jsonb_build_array(jsonb_build_object('degree', 'Beden Eğitimi ve Spor Öğretmenliği', 'school', 'Marmara Üniversitesi', 'year', '2017')),
    'certificates', jsonb_build_array(
      jsonb_build_object('name', 'NSCA CPT', 'issuer', 'NSCA', 'year', '2019'),
      jsonb_build_object('name', 'CrossFit Level 1', 'issuer', 'CrossFit', 'year', '2020')
    ),
    'workDays', '[1,3,5]'::jsonb,
    'workStart', '10:00',
    'workEnd', '19:00'
  )
),
(
  '10aea371-d7a1-43bd-bf02-10927d127396',
  'elif.kaya@yeniform.com',
  'Dr. Elif Kaya',
  'dietitian',
  true,
  jsonb_build_object(
    'phone', '+90 532 000 00 02',
    'title', 'Uzman Diyetisyen',
    'specialty', 'Spor Beslenmesi & Metabolik Sağlık',
    'specialties', jsonb_build_array('Spor beslenmesi', 'Kilo yönetimi', 'Metabolik sağlık'),
    'headline', 'Sürdürülebilir beslenme alışkanlıklarıyla enerjinizi yükseltin.',
    'bio', 'Klinik ve spor beslenmesi alanında uzmanlaşan Elif, yaşam tarzına uyumlu beslenme planları oluşturur.',
    'photo', '/team/team-dietitian-1.png',
    'city', 'Ankara',
    'district', 'Çankaya',
    'gender', 'female',
    'experienceYears', 8,
    'languages', jsonb_build_array('Türkçe', 'İngilizce'),
    'education', jsonb_build_array(jsonb_build_object('degree', 'Beslenme ve Diyetetik Lisans', 'school', 'Hacettepe Üniversitesi', 'year', '2015')),
    'certificates', jsonb_build_array(jsonb_build_object('name', 'Spor Beslenmesi Uzmanlık Sertifikası', 'issuer', 'TDD', 'year', '2019')),
    'workDays', '[1,2,3,4,5]'::jsonb,
    'workStart', '10:00',
    'workEnd', '19:00'
  )
),
(
  '21bfb482-e8b2-54ce-cf13-22038e238507',
  'zeynep.arslan@yeniform.com',
  'Zeynep Arslan',
  'dietitian',
  true,
  jsonb_build_object(
    'phone', '+90 532 000 00 04',
    'title', 'Klinik Diyetisyen',
    'specialty', 'Kilo Yönetimi & Duygusal Beslenme',
    'specialties', jsonb_build_array('Kilo yönetimi', 'Duygusal yeme', 'Plant-based beslenme', 'Hamilelik beslenmesi'),
    'headline', 'Kısıtlayıcı olmayan, yaşam tarzınıza uygun beslenme rehberliği.',
    'bio', 'Online danışmanlıkta davranışsal beslenme yaklaşımını benimseyen Zeynep, sürdürülebilir alışkanlıklar kazandırmaya odaklanır.',
    'photo', '/team/team-dietitian-2.png',
    'city', 'İstanbul',
    'district', 'Beşiktaş',
    'gender', 'female',
    'experienceYears', 6,
    'languages', jsonb_build_array('Türkçe'),
    'education', jsonb_build_array(jsonb_build_object('degree', 'Beslenme ve Diyetetik Lisans', 'school', 'İstanbul Üniversitesi', 'year', '2018')),
    'certificates', jsonb_build_array(jsonb_build_object('name', 'Duygusal Yeme ve Davranışsal Beslenme', 'issuer', 'Uluslararası Beslenme Akademisi', 'year', '2021')),
    'workDays', '[2,3,4,5,6]'::jsonb,
    'workStart', '09:00',
    'workEnd', '17:00'
  )
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  active = EXCLUDED.active,
  data = public.staff.data || EXCLUDED.data;
