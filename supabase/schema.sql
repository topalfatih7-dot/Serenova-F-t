-- =====================================================================
--  DEPRECATED — Bu dosya artık şema kaynağı değildir (2026-07)
--  ---------------------------------------------------------------------
--  Güncel tek kaynak:  supabase/setup.sql
--  Artımlı güncellemeler:  supabase/migrations/*.sql  (npm run db:migrate)
--
--  Yeni kurulum veya şema senkronu için SQL Editor'da setup.sql dosyasının
--  TAMAMINI çalıştırın. Bu dosyayı çalıştırmayın.
--
--  Eski schema.sql membership_requests gibi kaldırılmış tabloları içeriyordu;
--  yanlışlıkla çalıştırılırsa hayalet tablo/RLS riski oluşurdu.
-- =====================================================================

do $$
begin
  raise notice 'schema.sql kullanımdan kaldırıldı. Lütfen supabase/setup.sql dosyasını çalıştırın.';
end $$;
