-- Blog yazarı kadro adı değil; her yazıda Yeni Form Ekibi.
update public.posts
set data = jsonb_set(coalesce(data, '{}'::jsonb), '{author}', '"Yeni Form Ekibi"'::jsonb, true)
where coalesce(data->>'author', '') is distinct from 'Yeni Form Ekibi';
