-- Plan ikon alanı (Lucide component adı, örn. Dumbbell)
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS icon text;

UPDATE public.plans SET icon = COALESCE(icon, CASE id
  WHEN 'free' THEN 'Sparkles'
  WHEN 'eko' THEN 'Leaf'
  WHEN 'diyet' THEN 'Sparkles'
  WHEN 'spor' THEN 'Dumbbell'
  WHEN 'doktor' THEN 'Stethoscope'
  WHEN 'vip' THEN 'Award'
  WHEN 'kurucu' THEN 'Crown'
  WHEN 'gumus' THEN 'Star'
  WHEN 'altin' THEN 'Crown'
  WHEN 'platinum' THEN 'Award'
  ELSE 'Package'
END)
WHERE icon IS NULL;
