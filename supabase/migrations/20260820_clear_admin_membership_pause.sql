-- Admin üyelik dondurma / iptal paneli kaldırıldı.
-- Pasif bırakılmış üyeler personel listesinde sıkışmasın; paket ve Stripe değişmez.

UPDATE public.members
SET
  membership_status = 'active',
  data = (COALESCE(data, '{}'::jsonb)
    - 'pauseUntil'
    - 'membershipStatusNote'
    - 'membershipStatusChangedAt'),
  updated_at = now()
WHERE membership_status IN ('paused', 'cancelled');
