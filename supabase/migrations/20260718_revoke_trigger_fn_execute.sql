-- Trigger / yardımcı SECURITY DEFINER fonksiyonlarını REST RPC yüzeyinden kaldır
revoke all on function public.enforce_success_story_rate_limit() from public, anon, authenticated;
revoke all on function public.enforce_ticket_rate_limit() from public, anon, authenticated;

revoke all on function public.enforce_member_privileged_fields() from public, anon;
revoke all on function public.current_staff_id() from public, anon;
grant execute on function public.current_staff_id() to authenticated, service_role;

revoke all on function public.staff_manages_member(uuid) from public, anon;
grant execute on function public.staff_manages_member(uuid) to authenticated, service_role;
