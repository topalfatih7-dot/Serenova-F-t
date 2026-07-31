-- Kan tahlili analizi marketing satırını geri ekle (doktor görüşme hakkı EKLENMEZ).

-- eko_diyet / diyet
UPDATE public.plans
SET features = jsonb_build_array(
  jsonb_build_object('text', 'Doktor Tarafından Kan Tahlili Testi Analizi', 'included', true)
) || coalesce(features, '[]'::jsonb),
updated_at = now()
WHERE id IN ('eko_diyet', 'diyet')
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(coalesce(features, '[]'::jsonb)) AS f
    WHERE lower(f->>'text') LIKE '%kan tahlili%'
  );

-- vip
UPDATE public.plans
SET features = jsonb_build_array(
  jsonb_build_object('text', 'Kan Tahlili Testi Analizi', 'included', true)
) || coalesce(features, '[]'::jsonb),
updated_at = now()
WHERE id = 'vip'
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(coalesce(features, '[]'::jsonb)) AS f
    WHERE lower(f->>'text') LIKE '%kan tahlili%'
  );

-- Entitlements dokunulmaz — doktor görüşmesi yalnızca doktor paketinde kalır.
UPDATE public.plans
SET entitlements = coalesce(entitlements, '{}'::jsonb) || '{"doctorMeetingsPerMonth":0}'::jsonb,
    updated_at = now()
WHERE id IN ('eko_diyet', 'diyet', 'vip', 'eko_spor', 'spor');
