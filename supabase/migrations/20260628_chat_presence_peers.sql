-- Chat partner presence: üye ↔ personel ve personel ↔ admin sohbetlerinde çevrimiçi durumu

drop policy if exists user_presence_chat_peers on public.user_presence;
create policy user_presence_chat_peers on public.user_presence
  for select using (
    exists (
      select 1 from public.chat_threads ct
      where (ct.member_id = auth.uid() and ct.staff_id = user_presence.user_id)
         or (ct.staff_id = auth.uid() and ct.member_id = user_presence.user_id)
    )
    or (
      user_presence.role = 'admin'
      and exists (select 1 from public.admin_staff_threads ast where ast.staff_id = auth.uid())
    )
  );
