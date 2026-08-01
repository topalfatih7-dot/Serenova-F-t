-- Performans: RLS initplan, çift permissive policy, eksik FK indexleri

-- ---------------------------------------------------------------------------
-- staff_collab: auth.uid() satır satır yeniden hesaplanmasın
-- ---------------------------------------------------------------------------
drop policy if exists staff_collab_threads_select on public.staff_collab_threads;
create policy staff_collab_threads_select on public.staff_collab_threads for select using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
  or doctor_id = (select auth.uid())
);

drop policy if exists staff_collab_threads_insert on public.staff_collab_threads;
create policy staff_collab_threads_insert on public.staff_collab_threads for insert with check (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
  or doctor_id = (select auth.uid())
);

drop policy if exists staff_collab_threads_update on public.staff_collab_threads;
create policy staff_collab_threads_update on public.staff_collab_threads for update using (
  public.is_admin()
  or coach_id = (select auth.uid())
  or dietitian_id = (select auth.uid())
  or doctor_id = (select auth.uid())
);

drop policy if exists staff_collab_messages_select on public.staff_collab_messages;
create policy staff_collab_messages_select on public.staff_collab_messages for select using (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.coach_id = (select auth.uid())
        or t.dietitian_id = (select auth.uid())
        or t.doctor_id = (select auth.uid())
      )
  )
);

drop policy if exists staff_collab_messages_insert on public.staff_collab_messages;
create policy staff_collab_messages_insert on public.staff_collab_messages for insert with check (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        (sender_type = 'coach' and t.coach_id = (select auth.uid()))
        or (sender_type = 'dietitian' and t.dietitian_id = (select auth.uid()))
        or (sender_type = 'doctor' and t.doctor_id = (select auth.uid()))
        or public.is_admin()
      )
  )
);

-- ---------------------------------------------------------------------------
-- session_recordings: admin_all zaten SELECT kapsar — çift policy kaldır
-- ---------------------------------------------------------------------------
drop policy if exists session_recordings_admin_select on public.session_recordings;

-- ---------------------------------------------------------------------------
-- site_content INSERT: iki permissive policy → tek OR politikası
-- ---------------------------------------------------------------------------
drop policy if exists site_content_admin_insert on public.site_content;
drop policy if exists site_content_member_story on public.site_content;
create policy site_content_insert on public.site_content
  for insert to authenticated
  with check (
    public.is_admin()
    or kind = 'success_story'
  );

-- ---------------------------------------------------------------------------
-- FK indexleri (unindexed_foreign_keys advisor)
-- ---------------------------------------------------------------------------
create index if not exists ai_usage_logs_user_id_idx
  on public.ai_usage_logs (user_id);

create index if not exists meal_analysis_cache_created_by_idx
  on public.meal_analysis_cache (created_by);
