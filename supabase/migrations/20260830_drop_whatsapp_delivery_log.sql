-- WhatsApp Cloud API kaldırıldı; delivery audit tablosu artık kullanılmıyor.

drop table if exists public.whatsapp_delivery_log;
