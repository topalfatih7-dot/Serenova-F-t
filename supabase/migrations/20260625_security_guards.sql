-- Güvenlik guard'ları: is_admin genişletme, activities RLS, increment_food_usage kaldırma

-- Admin: e-posta VEYA members.role = 'admin'
create or replace function public.is_admin()
returns boolean language sql stable
set search_path = public, pg_temp as $$
  select coalesce(
    (auth.jwt() ->> 'email') = 'admin@serenova.fit',
    false
  )
  or exists (
    select 1 from public.members m
    where m.id = auth.uid() and m.role = 'admin'
  );
$$;

-- Aktivite kaydı: üye yalnızca kendi kaydını, personel/admin serbest
drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities for insert with check (
  public.is_admin()
  or public.is_staff()
  or (member_id = auth.uid())
);

-- Kullanılmayan fonksiyon — yetkileri kaldır
revoke all on function public.increment_food_usage(uuid) from public, anon, authenticated;
drop function if exists public.increment_food_usage(uuid);

-- get_active_users: yalnızca authenticated (fonksiyon içinde is_admin kontrolü var)
revoke all on function public.get_active_users() from public, anon;
