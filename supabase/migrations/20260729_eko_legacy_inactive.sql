-- Legacy tek `eko` plan: satış kapalı, pasif (aktif üye yok; migrate helper saklanır).
insert into public.plans (id, name, price, period, is_active, is_sellable, billing_type, sort_order, updated_at)
values ('eko', 'Eko Paket (eski)', 1299, 'Aylık', false, false, 'recurring', 99, now())
on conflict (id) do update set
  is_active = false,
  is_sellable = false,
  updated_at = now();
