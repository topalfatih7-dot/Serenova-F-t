-- Supabase performans linter düzeltmeleri (davranış DEĞİŞMEZ — yalnızca sorgu planı optimizasyonu):
--   1) auth_rls_initplan  — RLS policy'lerinde doğrudan auth.uid() çağrıları her satır için
--      yeniden değerlendiriliyordu; (select auth.uid()) sarmalaması ile planlayıcı bunu tek
--      seferlik initPlan olarak önbelleğe alır.
--   2) unindexed_foreign_keys — FK sütunlarına kapsayan index eklendi.
--   3) multiple_permissive_policies — aynı rol+işlem için üst üste binen "_admin_write" (ALL)
--      politikaları, zaten aynı erişimi kapsayan SELECT/UPDATE politikalarıyla çakışıyordu.
--      ALL politikaları INSERT/UPDATE/DELETE'e daraltıldı (SELECT örtüşmesi kaldırıldı);
--      staff ve user_presence tablolarında UPDATE/SELECT politikaları tek politika altında
--      birleştirildi (OR mantığı korunarak).

-- ---------------------------------------------------------------------
-- 1) auth_rls_initplan — (select auth.uid()) sarmalaması
-- ---------------------------------------------------------------------

alter policy "members_insert" on public.members
  with check ((id = (select auth.uid())) OR is_admin());

alter policy "members_select" on public.members
  using (is_admin() OR (id = (select auth.uid())) OR (EXISTS ( SELECT 1
    FROM staff s
    WHERE (((s.id = members.assigned_coach_id) OR (s.id = members.assigned_dietitian_id) OR (s.id = members.assigned_doctor_id)) AND (lower(s.email) = lower(current_email()))))));

alter policy "members_update" on public.members
  using (is_admin() OR (id = (select auth.uid())) OR (EXISTS ( SELECT 1
    FROM staff s
    WHERE (((s.id = members.assigned_coach_id) OR (s.id = members.assigned_dietitian_id) OR (s.id = members.assigned_doctor_id)) AND (lower(s.email) = lower(current_email()))))));

alter policy "tickets_select" on public.tickets
  using ((is_admin() OR (member_id = (select auth.uid()))));

alter policy "tickets_insert" on public.tickets
  with check ((is_admin() OR (member_id = (select auth.uid()))));

alter policy "tickets_update" on public.tickets
  using ((is_admin() OR (member_id = (select auth.uid()))));

alter policy "payments_select" on public.payments
  using ((is_admin() OR (member_id = (select auth.uid()))));

alter policy "payments_insert" on public.payments
  with check ((is_admin() OR (member_id = (select auth.uid()))));

alter policy "programs_select" on public.programs
  using ((is_admin() OR (member_id = (select auth.uid())) OR staff_manages_member(member_id)));

-- user_presence_self: bkz. §3 — bu politika aşağıda tamamen birleştirilip yeniden oluşturuluyor,
-- bu yüzden burada ayrıca alter edilmiyor.

alter policy "activities_insert" on public.activities
  with check ((is_admin() OR is_staff() OR (member_id = (select auth.uid()))));

alter policy "chat_threads_select" on public.chat_threads
  using ((is_admin() OR (member_id = (select auth.uid())) OR staff_manages_member(member_id)));

alter policy "chat_threads_insert" on public.chat_threads
  with check ((is_admin() OR (member_id = (select auth.uid())) OR staff_manages_member(member_id)));

alter policy "chat_threads_update" on public.chat_threads
  using ((is_admin() OR (member_id = (select auth.uid())) OR staff_manages_member(member_id)))
  with check ((is_admin() OR (member_id = (select auth.uid())) OR staff_manages_member(member_id)));

alter policy "chat_messages_select" on public.chat_messages
  using (EXISTS ( SELECT 1
    FROM chat_threads t
    WHERE ((t.id = chat_messages.thread_id) AND (is_admin() OR (t.member_id = (select auth.uid())) OR staff_manages_member(t.member_id)))));

alter policy "chat_messages_insert" on public.chat_messages
  with check (EXISTS ( SELECT 1
    FROM chat_threads t
    WHERE ((t.id = chat_messages.thread_id) AND (is_admin() OR (t.member_id = (select auth.uid())) OR staff_manages_member(t.member_id)))));

alter policy "staff_collab_threads_select" on public.staff_collab_threads
  using ((is_admin() OR (coach_id = (select auth.uid())) OR (dietitian_id = (select auth.uid()))));

alter policy "staff_collab_threads_insert" on public.staff_collab_threads
  with check ((is_admin() OR (coach_id = (select auth.uid())) OR (dietitian_id = (select auth.uid()))));

alter policy "staff_collab_threads_update" on public.staff_collab_threads
  using ((is_admin() OR (coach_id = (select auth.uid())) OR (dietitian_id = (select auth.uid()))));

alter policy "staff_collab_messages_select" on public.staff_collab_messages
  using (EXISTS ( SELECT 1
    FROM staff_collab_threads t
    WHERE ((t.id = staff_collab_messages.thread_id) AND (is_admin() OR (t.coach_id = (select auth.uid())) OR (t.dietitian_id = (select auth.uid()))))));

alter policy "staff_collab_messages_insert" on public.staff_collab_messages
  with check (EXISTS ( SELECT 1
    FROM staff_collab_threads t
    WHERE ((t.id = staff_collab_messages.thread_id) AND (((staff_collab_messages.sender_type = 'coach'::text) AND (t.coach_id = (select auth.uid()))) OR ((staff_collab_messages.sender_type = 'dietitian'::text) AND (t.dietitian_id = (select auth.uid()))) OR is_admin()))));

-- ---------------------------------------------------------------------
-- 2) unindexed_foreign_keys
-- ---------------------------------------------------------------------

create index if not exists idx_activities_member_id on public.activities (member_id);
create index if not exists idx_payments_member_id on public.payments (member_id);
create index if not exists idx_programs_member_id on public.programs (member_id);
create index if not exists idx_programs_staff_id on public.programs (staff_id);
create index if not exists idx_tickets_member_id on public.tickets (member_id);

-- ---------------------------------------------------------------------
-- 3) multiple_permissive_policies — ALL politikalarını SELECT dışına daraltma
--    (SELECT zaten her tabloda ayrı, en az bu kapsamda erişim veren bir politikayla kapsanıyor)
-- ---------------------------------------------------------------------

-- exercises: exercises_select (true) zaten herkese açık okuma sağlıyor.
drop policy if exists "exercises_admin_write" on public.exercises;
create policy "exercises_admin_insert" on public.exercises for insert with check (is_admin());
create policy "exercises_admin_update" on public.exercises for update using (is_admin()) with check (is_admin());
create policy "exercises_admin_delete" on public.exercises for delete using (is_admin());

-- plans: plans_select (true) zaten herkese açık okuma sağlıyor.
drop policy if exists "plans_admin_write" on public.plans;
create policy "plans_admin_insert" on public.plans for insert with check (is_admin());
create policy "plans_admin_update" on public.plans for update using (is_admin()) with check (is_admin());
create policy "plans_admin_delete" on public.plans for delete using (is_admin());

-- posts: posts_select (published OR is_admin()) zaten admin'in taslakları görmesini kapsıyor.
drop policy if exists "posts_admin_write" on public.posts;
create policy "posts_admin_insert" on public.posts for insert with check (is_admin());
create policy "posts_admin_update" on public.posts for update using (is_admin()) with check (is_admin());
create policy "posts_admin_delete" on public.posts for delete using (is_admin());

-- programs: programs_select (is_admin() OR member_id=... OR staff_manages_member(...)) zaten
-- programs_write'ın SELECT kapsamını (is_admin() OR staff_manages_member(...)) içeriyor.
drop policy if exists "programs_write" on public.programs;
create policy "programs_admin_insert" on public.programs for insert with check ((is_admin() OR staff_manages_member(member_id)));
create policy "programs_admin_update" on public.programs for update using ((is_admin() OR staff_manages_member(member_id))) with check ((is_admin() OR staff_manages_member(member_id)));
create policy "programs_admin_delete" on public.programs for delete using ((is_admin() OR staff_manages_member(member_id)));

-- site_content: yalnızca SELECT çakışması var (site_content_select: true zaten herkese açık);
-- INSERT çakışması (admin vs. üye başarı hikayesi) kasıtlı iki farklı kural olduğundan korunuyor.
drop policy if exists "site_content_admin_write" on public.site_content;
create policy "site_content_admin_insert" on public.site_content for insert with check (is_admin());
create policy "site_content_admin_update" on public.site_content for update using (is_admin()) with check (is_admin());
create policy "site_content_admin_delete" on public.site_content for delete using (is_admin());

-- staff: staff_select (true) SELECT'i zaten kapsıyor; UPDATE için admin + kendi profilini
-- güncelleme tek politikada birleştirildi (davranış aynı, OR mantığı korunuyor).
drop policy if exists "staff_admin_write" on public.staff;
drop policy if exists "staff_self_update" on public.staff;
create policy "staff_admin_insert" on public.staff for insert with check (is_admin());
create policy "staff_admin_delete" on public.staff for delete using (is_admin());
create policy "staff_update" on public.staff for update
  using (is_admin() OR (lower(email) = lower(current_email())))
  with check (is_admin() OR ((lower(email) = lower(current_email())) AND (id = current_staff_id())));

-- user_presence: 3 ayrı SELECT-veren politika (admin / chat peers / self) tek politikada
-- birleştirildi; yazma (insert/update/delete) yalnızca kendi satırı için ayrıldı.
drop policy if exists "user_presence_admin_select" on public.user_presence;
drop policy if exists "user_presence_chat_peers" on public.user_presence;
drop policy if exists "user_presence_self" on public.user_presence;
create policy "user_presence_select" on public.user_presence for select using (
  is_admin()
  OR (user_id = (select auth.uid()))
  OR (EXISTS ( SELECT 1 FROM chat_threads ct
      WHERE (((ct.member_id = (select auth.uid())) AND (ct.staff_id = user_presence.user_id))
          OR ((ct.staff_id = (select auth.uid())) AND (ct.member_id = user_presence.user_id)))))
  OR ((role = 'admin'::text) AND (EXISTS ( SELECT 1 FROM admin_staff_threads ast
      WHERE (ast.staff_id = (select auth.uid())))))
);
create policy "user_presence_insert" on public.user_presence for insert with check (user_id = (select auth.uid()));
create policy "user_presence_update" on public.user_presence for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "user_presence_delete" on public.user_presence for delete using (user_id = (select auth.uid()));
