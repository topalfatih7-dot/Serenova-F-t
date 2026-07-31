-- Doktor görüşmesi yalnızca doktor paketinde (doctorSessionsTotal).
-- Abonelik planlarından aylık doctorMeetingsPerMonth ve doktor/kan tahlili marketing satırları kaldırılır.

UPDATE public.plans
SET
  entitlements = coalesce(entitlements, '{}'::jsonb) || '{"doctorMeetingsPerMonth":0,"doctorSessionsTotal":0}'::jsonb,
  updated_at = now()
WHERE id IN ('eko_diyet', 'diyet', 'eko_spor', 'spor', 'vip', 'eko');

UPDATE public.plans
SET
  entitlements = coalesce(entitlements, '{}'::jsonb)
    || '{"doctorMeetingsPerMonth":0,"doctorSessionsTotal":1}'::jsonb,
  billing_type = 'one_time',
  updated_at = now()
WHERE id = 'doktor';

-- Marketing features: doktor / kan tahlili satırlarını çıkar
UPDATE public.plans
SET
  features = (
    SELECT coalesce(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(coalesce(features, '[]'::jsonb)) AS elem
    WHERE lower(elem->>'text') NOT LIKE '%doktor%'
      AND lower(elem->>'text') NOT LIKE '%kan tahlili%'
  ),
  updated_at = now()
WHERE id IN ('eko_diyet', 'diyet', 'eko_spor', 'spor', 'vip', 'eko');

-- Mevcut üyeler: packageConfig aylık doktor hakkını sıfırla
UPDATE public.members
SET data = jsonb_set(data, '{packageConfig,doctorMeetingsPerMonth}', '0'),
    updated_at = now()
WHERE coalesce((data->'packageConfig'->>'doctorMeetingsPerMonth')::int, 0) > 0;

-- activePackages içinde doktor dışı girişlerde aylık doktor hakkını sıfırla (dizi yoksa dokunma)
UPDATE public.members m
SET data = jsonb_set(
  m.data,
  '{activePackages}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN coalesce(pkg->>'planId', '') = 'doktor' THEN pkg
        WHEN pkg ? 'packageConfig'
          AND coalesce((pkg->'packageConfig'->>'doctorMeetingsPerMonth')::int, 0) > 0
        THEN jsonb_set(pkg, '{packageConfig,doctorMeetingsPerMonth}', '0')
        ELSE pkg
      END
    )
    FROM jsonb_array_elements(m.data->'activePackages') AS pkg
  )
),
updated_at = now()
WHERE jsonb_typeof(m.data->'activePackages') = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(m.data->'activePackages') AS pkg
    WHERE coalesce(pkg->>'planId', '') <> 'doktor'
      AND coalesce((pkg->'packageConfig'->>'doctorMeetingsPerMonth')::int, 0) > 0
  );
