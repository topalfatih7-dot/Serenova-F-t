-- KÖK NEDEN: staff_manages_member() tüm atanmış personele (koç + diyetisyen + doktor) aynı
-- üyenin TÜM mesajlarını gösteriyordu. Realtime aboneliği RLS'yi dikkate alır, bu yüzden
-- diyetisyenin aboneliği de koçun thread mesajlarını alıyordu → yanlış bildirim.
--
-- DÜZELTME: chat_messages ve chat_threads için SELECT politikaları yalnızca
-- o thread'in sahibi personeli (t.staff_id = auth.uid()) veya üyeyi veya admin'i kapsar.
-- Her personel artık SADECE kendi thread'lerindeki mesajları görür.

-- 1. chat_messages SELECT: yalnızca thread sahibi personel/üye/admin görebilir
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
          public.is_admin()
          or t.member_id = auth.uid()
          or t.staff_id = auth.uid()
        )
    )
  );

-- 2. chat_threads SELECT: personel yalnızca kendi thread'lerini görür
drop policy if exists "chat_threads_select" on public.chat_threads;
create policy "chat_threads_select"
  on public.chat_threads
  as permissive for select
  to authenticated
  using (
    public.is_admin()
    or member_id = auth.uid()
    or staff_id = auth.uid()
  );

-- 3. chat_threads UPDATE: personel yalnızca kendi thread'lerini güncelleyebilir
drop policy if exists "chat_threads_update" on public.chat_threads;
create policy "chat_threads_update"
  on public.chat_threads
  as permissive for update
  to authenticated
  using (
    public.is_admin()
    or member_id = auth.uid()
    or staff_id = auth.uid()
  )
  with check (
    public.is_admin()
    or member_id = auth.uid()
    or staff_id = auth.uid()
  );
