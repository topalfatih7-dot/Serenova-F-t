-- Güvenlik sertleştirmesi: kadro iletişim bilgilerini (email, telefon, sosyal medya)
-- herkese açık SELECT'ten çıkarır; üyelerin platform dışı iletişime yönlendirilme
-- riskini azaltır. Ayrıca chat_threads insert'i gerçek atamayla sınırlar ve
-- user_presence üzerinden email sızıntısını kapatır.

-- 1) Hassas alanları JSONB'den temizleyen yardımcı fonksiyon
create or replace function public.strip_staff_contact_fields(p_data jsonb)
returns jsonb
language sql
immutable
as $$
  select (coalesce(p_data, '{}'::jsonb)) - 'phone' - 'instagram' - 'youtube' - 'website' - 'linkedin';
$$;

-- 2) Güvenli kadro görünümü — email/telefon/sosyal medya yok.
-- Kasıtlı olarak security_invoker AYARLANMAZ (view sahibi ayrıcalığıyla çalışır):
-- amaç, staff tablosunun (3) ile daraltılan ham SELECT'ine rağmen herkese
-- yalnızca güvenli alanları sunmaktır.
drop view if exists public.staff_directory;
create view public.staff_directory as
select
  id,
  name,
  role,
  active,
  created_at,
  public.strip_staff_contact_fields(data) as data
from public.staff;

grant select on public.staff_directory to anon, authenticated;

-- 3) staff tablosunun ham SELECT'i artık yalnızca admin veya kendi kaydı.
-- Herkese açık / üye tarafı erişimi (2)'deki staff_directory view'ına taşındı.
drop policy if exists staff_select on public.staff;
create policy staff_select on public.staff for select using (
  public.is_admin() or lower(email) = lower(public.current_email())
);

-- 4) user_presence — email sütununu chat-peer / admin görünümünden gizleyen view.
-- security_invoker = true: temeldeki RLS (self/admin/chat peer) aynen uygulanır,
-- yalnızca kolonlar daraltılır (email dahil değil).
drop view if exists public.user_presence_public;
create view public.user_presence_public
with (security_invoker = true)
as
select user_id, last_seen_at, role, session_started_at, page_path
from public.user_presence;

grant select on public.user_presence_public to authenticated;

-- 5) chat_threads insert — üye yalnızca GERÇEKTEN atanmış koç/diyetisyen/doktor
-- ile thread açabilsin (önceden staff_id hiç doğrulanmıyordu, keyfi bir staff_id
-- ile thread açılabiliyordu).
drop policy if exists chat_threads_insert on public.chat_threads;
create policy chat_threads_insert on public.chat_threads for insert with check (
  public.is_admin()
  or public.staff_manages_member(member_id)
  or (
    member_id = (select auth.uid())
    and exists (
      select 1 from public.members m
      where m.id = member_id
        and (
          staff_id = m.assigned_coach_id
          or staff_id = m.assigned_dietitian_id
          or staff_id = m.assigned_doctor_id
        )
    )
  )
);
