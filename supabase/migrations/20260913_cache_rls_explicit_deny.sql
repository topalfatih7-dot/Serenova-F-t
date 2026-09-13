-- Cache tabloları zaten GRANT'sız; açık deny policy advisor + savunma katmanı.
-- Tetikleyici fonksiyonlarını REST RPC yüzeyinden düşür.

drop policy if exists product_nutrition_cache_deny_clients on public.product_nutrition_cache;
create policy product_nutrition_cache_deny_clients
  on public.product_nutrition_cache
  for all
  to anon, authenticated
  using (false)
  with check (false);

drop policy if exists usda_food_cache_deny_clients on public.usda_food_cache;
create policy usda_food_cache_deny_clients
  on public.usda_food_cache
  for all
  to anon, authenticated
  using (false)
  with check (false);

revoke all on function public.enforce_member_privileged_fields() from public, anon, authenticated;
revoke all on function public.enforce_staff_self_columns() from public, anon, authenticated;
revoke all on function public.enforce_ticket_member_writes() from public, anon, authenticated;
