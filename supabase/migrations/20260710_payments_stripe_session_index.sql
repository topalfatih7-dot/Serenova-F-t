-- Stripe webhook idempotency: payments.data->stripeSessionId araması için index

create index if not exists idx_payments_stripe_session_id
  on public.payments ((data->>'stripeSessionId'))
  where coalesce(data->>'stripeSessionId', '') <> '';
