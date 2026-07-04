-- Eski public Supabase URL'lerini storage path'e cevir (private bucket uyumu).
-- Ornek: .../object/public/exercise-videos/1234-abc.mp4 -> 1234-abc.mp4

update public.exercises
set video_url = regexp_replace(
  video_url,
  '^.+/exercise-videos/([^?]+).*$',
  '\1'
)
where video_url like '%/exercise-videos/%';
