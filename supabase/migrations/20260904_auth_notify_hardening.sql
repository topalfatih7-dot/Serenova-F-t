-- Auth/notification hardening (2026-08-31)
-- 1) Trigger fonksiyonunu REST RPC yüzeyinden kaldır
-- 2) Hot tablo RLS: auth.uid() satır başına yeniden hesaplanmasın
-- 3) influencer_earnings FK covering index

-- ---------------------------------------------------------------------------
-- Trigger RPC ifşası
-- ---------------------------------------------------------------------------
revoke all on function public.tg_chat_message_touch_thread() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- device_push_tokens RLS initplan
-- ---------------------------------------------------------------------------
drop policy if exists "device_push_tokens_select_own" on public.device_push_tokens;
create policy "device_push_tokens_select_own"
  on public.device_push_tokens
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "device_push_tokens_insert_own" on public.device_push_tokens;
create policy "device_push_tokens_insert_own"
  on public.device_push_tokens
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "device_push_tokens_update_own" on public.device_push_tokens;
create policy "device_push_tokens_update_own"
  on public.device_push_tokens
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "device_push_tokens_delete_own" on public.device_push_tokens;
create policy "device_push_tokens_delete_own"
  on public.device_push_tokens
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- chat_messages / chat_threads RLS initplan
-- (staff_own_thread_only semantiği korunur)
-- ---------------------------------------------------------------------------
drop policy if exists "chat_messages_select" on public.chat_messages;
create policy "chat_messages_select"
  on public.chat_messages
  as permissive for select
  to authenticated
  using (
    exists (
      select 1 from public.chat_threads t
      where t.id = chat_messages.thread_id
        and (
          (select public.is_admin())
          or t.member_id = (select auth.uid())
          or t.staff_id = (select auth.uid())
        )
    )
  );

drop policy if exists "chat_threads_select" on public.chat_threads;
create policy "chat_threads_select"
  on public.chat_threads
  as permissive for select
  to authenticated
  using (
    (select public.is_admin())
    or member_id = (select auth.uid())
    or staff_id = (select auth.uid())
  );

drop policy if exists "chat_threads_update" on public.chat_threads;
create policy "chat_threads_update"
  on public.chat_threads
  as permissive for update
  to authenticated
  using (
    (select public.is_admin())
    or member_id = (select auth.uid())
    or staff_id = (select auth.uid())
  )
  with check (
    (select public.is_admin())
    or member_id = (select auth.uid())
    or staff_id = (select auth.uid())
  );

-- ---------------------------------------------------------------------------
-- influencer_earnings unindexed FKs
-- ---------------------------------------------------------------------------
create index if not exists influencer_earnings_member_id_idx
  on public.influencer_earnings (member_id);

create index if not exists influencer_earnings_payment_id_idx
  on public.influencer_earnings (payment_id);
