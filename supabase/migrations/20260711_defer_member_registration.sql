-- Üye kaydı yalnızca onboarding tamamlandığında uygulama tarafından oluşturulur.
-- OAuth / e-posta auth.users oluşsa bile members satırı otomatik eklenmez.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  return new;
end;
$$;
