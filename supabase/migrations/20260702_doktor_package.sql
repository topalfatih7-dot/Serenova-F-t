-- Kurucu paketini kaldır; Doktor Paketi ekle; paket sırasını düzelt

UPDATE public.plans SET is_active = false, updated_at = now() WHERE id IN ('kurucu');

-- Ana paket sırası: free(0) → eko(1) → diyet(2) → spor(3) → doktor(4) → vip(5)
UPDATE public.plans SET sort_order = 0, updated_at = now() WHERE id = 'free';
UPDATE public.plans SET sort_order = 1, updated_at = now() WHERE id = 'eko';
UPDATE public.plans SET sort_order = 2, updated_at = now() WHERE id = 'diyet';
UPDATE public.plans SET sort_order = 3, updated_at = now() WHERE id = 'spor';
UPDATE public.plans SET sort_order = 4, updated_at = now() WHERE id = 'doktor';
UPDATE public.plans SET sort_order = 5, updated_at = now() WHERE id = 'vip';

INSERT INTO public.plans (id, name, price, period, is_active, badge, features, limits, pricing_tiers, color, sort_order) VALUES
('doktor', 'Doktor Paketi', 2500, 'Aylık', true, null,
 '[{"text":"Online Doktor Seansı","included":true}]'::jsonb,
 '["Online doktor görüşmesi"]'::jsonb,
 '[{"months":1,"label":"Aylık","price":2500},{"months":3,"label":"3 Aylık","price":6499},{"months":6,"label":"6 Aylık","price":9999}]'::jsonb,
 'teal', 4)
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

UPDATE public.plans SET sort_order = 5, badge = 'VIP', updated_at = now() WHERE id = 'vip';

UPDATE public.members
SET membership = 'doktor',
    data = jsonb_set(
      COALESCE(data, '{}'::jsonb),
      '{packageConfig}',
      '{"coachMeetingsPerMonth":0,"dietitianMeetingsPerMonth":0,"doctorMeetingsPerMonth":2,"coachMeetingsPerWeek":0,"durationMonths":1,"durationWeeks":4,"addOns":[]}'::jsonb,
      true
    )
WHERE membership = 'kurucu';
