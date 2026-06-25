-- Deneme SSS içeriklerini kaldır; üyelik dondurma/iptal taleplerini temizle; duraklatılmış/iptal statülerini sıfırla

DELETE FROM public.site_content WHERE kind = 'faq';

DELETE FROM public.membership_requests;

UPDATE public.members
SET
  membership_status = 'active',
  data = data - 'pauseUntil'
WHERE membership_status IN ('paused', 'cancelled');
