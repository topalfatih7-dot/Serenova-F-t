-- =====================================================================
--  Paket Sistemi Migrasyonu
--  Supabase Dashboard > SQL Editor'a yapıştırıp çalıştırın.
-- =====================================================================

-- members tablosuna telefon numarası sütunu ekle
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS phone text;

-- =====================================================================
--  PLANS TABLOSU — Admin panelinden düzenlenebilir paket yapısı
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  price integer NOT NULL DEFAULT 0,
  period text NOT NULL DEFAULT 'Aylık',
  is_active boolean NOT NULL DEFAULT true,
  badge text,
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  limits jsonb NOT NULL DEFAULT '[]'::jsonb,
  color text DEFAULT 'sage',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plans_select ON public.plans;
CREATE POLICY plans_select ON public.plans FOR SELECT USING (true);

DROP POLICY IF EXISTS plans_admin_write ON public.plans;
CREATE POLICY plans_admin_write ON public.plans FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- =====================================================================
--  VARSAYILAN PAKETLER
-- =====================================================================
INSERT INTO public.plans (id, name, price, period, is_active, badge, features, limits, color, sort_order)
VALUES
(
  'free',
  'Ücretsiz',
  0,
  'Süresiz',
  true,
  null,
  '[
    {"text": "YZ Profil & Vücut Analizi", "included": true},
    {"text": "Kişiselleştirilmiş Koç Listesi", "included": true},
    {"text": "Diyetisyen Beslenme Listesi", "included": true},
    {"text": "Video Kütüphanesi (Temel)", "included": true},
    {"text": "Topluluk Erişimi", "included": true},
    {"text": "Birebir Koç Görüşmesi", "included": false},
    {"text": "Diyetisyen Randevusu", "included": false},
    {"text": "İlerleme Raporları", "included": false},
    {"text": "Öncelikli Destek", "included": false}
  ]'::jsonb,
  '["Aylık 1 plan güncellemesi", "Temel bildirimler", "Standart destek"]'::jsonb,
  'sage',
  0
),
(
  'gumus',
  'Gümüş',
  999,
  'Aylık',
  true,
  null,
  '[
    {"text": "YZ Profil & Vücut Analizi", "included": true},
    {"text": "Video Kütüphanesi (Tam Erişim)", "included": true},
    {"text": "Haftada 1 Koç Görüşmesi", "included": true},
    {"text": "Aylık 1 Diyetisyen Görüşmesi", "included": true},
    {"text": "Temel İlerleme Takibi", "included": true},
    {"text": "E-posta Desteği", "included": true},
    {"text": "Grup Seansları", "included": false},
    {"text": "Öncelikli Destek", "included": false},
    {"text": "Kişisel Program", "included": false}
  ]'::jsonb,
  '["Haftada 1 koç görüşmesi", "Aylık 1 diyetisyen"]'::jsonb,
  'slate',
  1
),
(
  'altin',
  'Altın',
  1999,
  'Aylık',
  true,
  'En Popüler',
  '[
    {"text": "YZ Profil & Vücut Analizi", "included": true},
    {"text": "Video Kütüphanesi (Tam Erişim)", "included": true},
    {"text": "Haftada 2 Koç Görüşmesi", "included": true},
    {"text": "Aylık 2 Diyetisyen Görüşmesi", "included": true},
    {"text": "Detaylı İlerleme Raporları", "included": true},
    {"text": "Öncelikli Destek", "included": true},
    {"text": "Grup Seansları", "included": true},
    {"text": "Kişisel Program", "included": true},
    {"text": "7/24 VIP Destek", "included": false}
  ]'::jsonb,
  '["Haftada 2 koç görüşmesi", "Aylık 2 diyetisyen"]'::jsonb,
  'gold',
  2
),
(
  'platinum',
  'Platinum',
  3499,
  'Aylık',
  true,
  'Premium',
  '[
    {"text": "YZ Profil & Vücut Analizi", "included": true},
    {"text": "Video Kütüphanesi (Tam Erişim)", "included": true},
    {"text": "Haftada 3 Koç Görüşmesi", "included": true},
    {"text": "Haftada 1 Diyetisyen Görüşmesi", "included": true},
    {"text": "7/24 VIP Destek", "included": true},
    {"text": "Kişisel Program", "included": true},
    {"text": "Grup Seansları", "included": true},
    {"text": "Mental Wellness Seansları", "included": true},
    {"text": "Özel Aktiviteler & Etkinlikler", "included": true}
  ]'::jsonb,
  '["Haftada 3 koç görüşmesi", "Haftada 1 diyetisyen", "7/24 VIP destek"]'::jsonb,
  'brand',
  3
)
ON CONFLICT (id) DO NOTHING;
