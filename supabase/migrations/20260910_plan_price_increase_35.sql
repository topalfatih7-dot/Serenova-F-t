-- Liste fiyatı +%35. Küsürat 5 TL katına yukarı (ceil).
-- Kaynak: canlı public.plans (kod fallback 1299/2499 değil).
-- eko_spor 6 ay 9997 idi; yuvarlama sonrası eko_diyet 6 ay ile 13500.

update public.plans
set
  price = 2700,
  pricing_tiers = '[
    {"months":1,"label":"Aylık","price":2700},
    {"months":3,"label":"3 Aylık","price":7425},
    {"months":6,"label":"6 Aylık","price":13500}
  ]'::jsonb,
  updated_at = now()
where id in ('eko_diyet', 'eko_spor');

update public.plans
set
  price = 4050,
  pricing_tiers = '[
    {"months":1,"label":"Aylık","price":4050},
    {"months":3,"label":"3 Aylık","price":10125},
    {"months":6,"label":"6 Aylık","price":20250}
  ]'::jsonb,
  updated_at = now()
where id in ('diyet', 'spor');

update public.plans
set
  price = 7425,
  pricing_tiers = '[
    {"months":1,"label":"Aylık","price":7425},
    {"months":3,"label":"3 Aylık","price":18900},
    {"months":6,"label":"6 Aylık","price":40500}
  ]'::jsonb,
  updated_at = now()
where id = 'vip';
