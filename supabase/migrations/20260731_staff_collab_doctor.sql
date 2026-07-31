-- Üçlü collab: doktor thread’e dahil olabilir
alter table public.staff_collab_threads
  add column if not exists doctor_id uuid references public.staff(id) on delete set null;

create index if not exists staff_collab_threads_doctor_idx
  on public.staff_collab_threads (doctor_id);

alter table public.staff_collab_messages
  drop constraint if exists staff_collab_messages_sender_type_check;

alter table public.staff_collab_messages
  add constraint staff_collab_messages_sender_type_check
  check (sender_type in ('coach', 'dietitian', 'doctor'));

drop policy if exists staff_collab_threads_select on public.staff_collab_threads;
create policy staff_collab_threads_select on public.staff_collab_threads for select using (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
  or doctor_id = auth.uid()
);

drop policy if exists staff_collab_threads_insert on public.staff_collab_threads;
create policy staff_collab_threads_insert on public.staff_collab_threads for insert with check (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
  or doctor_id = auth.uid()
);

drop policy if exists staff_collab_threads_update on public.staff_collab_threads;
create policy staff_collab_threads_update on public.staff_collab_threads for update using (
  public.is_admin()
  or coach_id = auth.uid()
  or dietitian_id = auth.uid()
  or doctor_id = auth.uid()
);

drop policy if exists staff_collab_messages_select on public.staff_collab_messages;
create policy staff_collab_messages_select on public.staff_collab_messages for select using (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        public.is_admin()
        or t.coach_id = auth.uid()
        or t.dietitian_id = auth.uid()
        or t.doctor_id = auth.uid()
      )
  )
);

drop policy if exists staff_collab_messages_insert on public.staff_collab_messages;
create policy staff_collab_messages_insert on public.staff_collab_messages for insert with check (
  exists (
    select 1 from public.staff_collab_threads t
    where t.id = thread_id
      and (
        (sender_type = 'coach' and t.coach_id = auth.uid())
        or (sender_type = 'dietitian' and t.dietitian_id = auth.uid())
        or (sender_type = 'doctor' and t.doctor_id = auth.uid())
        or public.is_admin()
      )
  )
);
