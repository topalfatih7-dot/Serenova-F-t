-- =====================================================================
-- Yeni paket yapısı: Eko, Diyet, Spor, Kurucu, VIP
-- Görüşmeler ayda 2 defa (diyetisyen/koç paketlerinde)
-- pricing_tiers: 1/3/6 aylık fiyat seçenekleri
-- =====================================================================

ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS pricing_tiers jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Eski planları pasif yap (geriye dönük üyeler korunur)
UPDATE public.plans SET is_active = false WHERE id IN ('gumus', 'altin', 'platinum');

-- Yeni paketler
INSERT INTO public.plans (id, name, price, period, is_active, badge, features, limits, pricing_tiers, color, sort_order) VALUES
('eko', 'Eko Paket', 1299, 'Aylık', true, null,
 '[{"text":"Manuel Kalori Hesaplama","included":true},{"text":"Diyet Programı Ayda 2 Kere","included":true},{"text":"Spor Programı Ayda 1 Kere","included":true},{"text":"Video Kütüphanesi (Sınırlı)","included":true},{"text":"İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Birebir Koç Görüşmesi","included":false},{"text":"Diyetisyen Randevusu","included":false},{"text":"Fotoğraflı Kalori Tespiti","included":false}]'::jsonb,
 '["Sınırlı video erişimi","Program güncellemeleri"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":1299},{"months":3,"label":"3 Aylık","price":2999},{"months":6,"label":"6 Aylık","price":3999}]'::jsonb,
 'sage', 1),
('diyet', 'Diyet Paketi', 2499, 'Aylık', true, null,
 '[{"text":"Doktor Tarafından Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Diyetisyen ile Online Görüşme","included":true},{"text":"Diyet Üyeye Özel Diyet Programı","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Sınırsız Destek","included":true},{"text":"Birebir Koç Görüşmesi","included":false}]'::jsonb,
 '["Ayda 2 diyetisyen görüşmesi","Kişisel diyet programı"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2499},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'emerald', 2),
('spor', 'Spor Paketi', 2499, 'Aylık', true, null,
 '[{"text":"Doktor Tarafından Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Koç ile Online Görüşme","included":true},{"text":"Spor Üyeye Özel Spor Programı","included":true},{"text":"Sınırsız Video Kütüphanesi Erişimi","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Takip Programı","included":true},{"text":"Sınırsız Destek","included":true}]'::jsonb,
 '["Ayda 2 koç görüşmesi","Kişisel spor programı"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2499},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'blue', 3),
('kurucu', '100 Kurucu Üye', 3499, 'Aylık', true, 'Kurucu',
 '[{"text":"Doktor Tarafından Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Diyetisyen ile Online Görüşme","included":true},{"text":"Kurucu Üyeye Özel Diyet Programı","included":true},{"text":"Ayda 2 Koç ile Online Görüşme","included":true},{"text":"Kurucu Üyeye Özel Spor Programı","included":true},{"text":"Sınırsız Video Kütüphanesi Erişimi","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Ücretsiz Takip Programı","included":true},{"text":"Ömür Boyu %20 İndirim Garantisi","included":true},{"text":"Ömür Boyu Öncelikli Destek","included":true},{"text":"Kurucu Üye Rozeti","included":true}]'::jsonb,
 '["Ayda 2 koç + 2 diyetisyen","Ömür boyu avantajlar"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":3499,"compareAt":4999},{"months":3,"label":"3 Aylık","price":6999,"compareAt":12999},{"months":6,"label":"6 Aylık","price":10999,"compareAt":19999}]'::jsonb,
 'gold', 4),
('vip', 'Vip Paket', 4999, 'Aylık', true, 'VIP',
 '[{"text":"Kan Tahlili Testi Analizi","included":true},{"text":"Kişisel Sağlık & Vücut Analizi","included":true},{"text":"Fotoğraflı ve Manuel Kalori Hesaplama","included":true},{"text":"Ayda 2 Diyetisyen ile Online Görüşme","included":true},{"text":"Vip Üyeye Özel Diyet Programı","included":true},{"text":"Ayda 2 Koç ile Online Görüşme","included":true},{"text":"Vip Üyeye Özel Spor Programı","included":true},{"text":"Sınırsız Video Kütüphanesi Erişimi","included":true},{"text":"Sınırsız İlerleme Raporları","included":true},{"text":"Ücretsiz Takip Programı","included":true},{"text":"Sınırsız Destek","included":true},{"text":"Vip Üye Rozeti","included":true}]'::jsonb,
 '["Ayda 2 koç + 2 diyetisyen","Sınırsız destek"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":4999},{"months":3,"label":"3 Aylık","price":12999},{"months":6,"label":"6 Aylık","price":19999}]'::jsonb,
 'brand', 5)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  period = EXCLUDED.period,
  is_active = EXCLUDED.is_active,
  badge = EXCLUDED.badge,
  features = EXCLUDED.features,
  limits = EXCLUDED.limits,
  pricing_tiers = EXCLUDED.pricing_tiers,
  color = EXCLUDED.color,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- free planı güncelle
UPDATE public.plans SET sort_order = 0, is_active = true WHERE id = 'free';
