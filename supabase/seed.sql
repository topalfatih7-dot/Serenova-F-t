-- =====================================================================
--  Yeni Form — Temiz Başlangıç (seed)
--  setup.sql çalıştırıldıktan SONRA bunu SQL Editor'da çalıştırın.
--  Bu betik ÖRNEK/DEMO verisi EKLEMEZ; yalnızca tüm içerik tablolarını
--  boşaltarak temiz bir başlangıç sağlar. Tekrar çalıştırmak güvenlidir.
--
--  Not: 'members' tablosu KORUNUR (admin ve gerçek üye kayıtları burada).
--  Tüm üyeleri de silmek isterseniz en alttaki satırın yorumunu kaldırın.
-- =====================================================================

-- İçerik ve operasyonel veriler
delete from public.site_content;          -- yorumlar, SSS, başarı hikâyeleri
delete from public.posts;                 -- blog yazıları
delete from public.exercises;             -- hareket/egzersiz kütüphanesi
delete from public.programs;              -- üyelere atanmış programlar
delete from public.tickets;               -- destek talepleri
delete from public.activities;            -- aktivite kayıtları
delete from public.payments;              -- ödeme kayıtları
delete from public.staff;                 -- koç & diyetisyen kadrosu

-- Tüm üyeleri de temizlemek isterseniz (admin dahil!) aşağıyı açın:
-- delete from public.members;

-- =====================================================================
--  Bitti. Temiz bir kurulum hazır.
--  İçerik (yorum/SSS/başarı hikâyesi), kadro, blog ve hareket kütüphanesi
--  artık ADMIN PANELİNDEN eklenir.
--  Admin için: admin e-postası ile Supabase'e KAYIT olun (signUp),
--  ardından admin paneline erişebilirsiniz.
-- =====================================================================
