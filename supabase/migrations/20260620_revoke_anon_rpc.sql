-- Güvenlik: admin RPC fonksiyonlarını anon/public erişiminden kaldır
-- Supabase SQL Editor'da çalıştırın (veya apply_migration ile)

revoke all on function public.admin_upsert_staff(uuid, text, text, text, text, boolean, jsonb) from public, anon;
revoke all on function public.admin_delete_staff(uuid) from public, anon;
grant execute on function public.admin_upsert_staff(uuid, text, text, text, text, boolean, jsonb) to authenticated;
grant execute on function public.admin_delete_staff(uuid) to authenticated;

revoke all on function public.increment_food_usage(uuid) from public, anon;
grant execute on function public.increment_food_usage(uuid) to authenticated;

revoke all on function public.handle_new_user() from public, anon;
