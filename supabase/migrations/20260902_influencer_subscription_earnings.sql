-- Influencer hakedişi: aynı Stripe aboneliğinin yenileme faturaları
-- Kodlu abonelik iptal edilene kadar her çekimde %10 + ödenen tutarın %20’si.

alter table public.influencer_earnings
  add column if not exists stripe_invoice_id text;

create unique index if not exists influencer_earnings_stripe_invoice_uidx
  on public.influencer_earnings (stripe_invoice_id)
  where stripe_invoice_id is not null and stripe_invoice_id <> '';

comment on table public.influencer_earnings is
  'Kodlu abonelik hakedişi — ilk Checkout ve yenileme faturaları. Abonelik iptalinde durur.';

comment on column public.influencer_earnings.stripe_invoice_id is
  'Yenileme faturaları için tekilleştirme; ilk Checkout satırında boş kalabilir.';
