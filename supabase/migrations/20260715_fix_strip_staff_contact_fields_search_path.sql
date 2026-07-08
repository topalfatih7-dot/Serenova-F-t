-- Linter uyarısı: strip_staff_contact_fields search_path sabitlenmemiş.
create or replace function public.strip_staff_contact_fields(p_data jsonb)
returns jsonb
language sql
immutable
set search_path = public, pg_temp
as $$
  select (coalesce(p_data, '{}'::jsonb)) - 'phone' - 'instagram' - 'youtube' - 'website' - 'linkedin';
$$;
