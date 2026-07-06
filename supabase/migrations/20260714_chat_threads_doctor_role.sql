-- Üye ↔ doktor mesajlaşması: staff_role kısıtına doctor ekle
alter table public.chat_threads drop constraint if exists chat_threads_staff_role_check;
alter table public.chat_threads add constraint chat_threads_staff_role_check
  check (staff_role in ('coach', 'dietitian', 'doctor'));
