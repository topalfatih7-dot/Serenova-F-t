-- AI Basic/Eko program satırlarını ve coachingState'i temizle; Eko + Basic plan satışını kapat.

DELETE FROM public.programs
WHERE data->>'source' IN ('ai_basic', 'ai_eko');

UPDATE public.members
SET data = (data - 'coachingState'),
    updated_at = now()
WHERE data ? 'coachingState';

UPDATE public.plans
SET is_active = false,
    updated_at = now()
WHERE id IN ('eko', 'free');
