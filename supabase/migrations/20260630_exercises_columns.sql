-- exercises tablosuna eksik sport_type / body_part sütunlarını ekle
-- (eski veritabanlarında bu sütunlar oluşturulmamış olabilir)

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS sport_type text DEFAULT 'Fitness';
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS body_part text DEFAULT 'Tüm Vücut';

-- Mevcut satırları kategori değeriyle doldur
UPDATE public.exercises SET body_part = COALESCE(NULLIF(body_part, ''), category, 'Tüm Vücut') WHERE body_part IS NULL OR body_part = '';
UPDATE public.exercises SET sport_type = COALESCE(NULLIF(sport_type, ''), 'Fitness') WHERE sport_type IS NULL OR sport_type = '';

-- PostgREST şema önbelleğini yenile
NOTIFY pgrst, 'reload schema';
