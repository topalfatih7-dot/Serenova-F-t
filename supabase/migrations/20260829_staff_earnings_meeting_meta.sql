-- Hakediş geçmişi: danışan adı + görüşme başlangıcı (ödeme penceresi start saatine bakılır)
alter table public.staff_earnings
  add column if not exists session_started_at timestamptz,
  add column if not exists member_name text;

comment on column public.staff_earnings.session_started_at is
  'Görüşme başlangıcı. Tahakkuk penceresi (Cuma 00:00–Perşembe 23:59, Europe/Istanbul) bu saate göre; gün değişiminde start kullanılır.';

comment on column public.staff_earnings.member_name is
  'Hakediş anındaki danışan adı — atama kalksa da geçmişte okunur.';
