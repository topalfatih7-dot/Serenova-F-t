-- Savunma derinliği: istemci tarafı filtresi atlanıp doğrudan REST API'ye
-- (kullanıcının kendi JWT'siyle) istek atılsa bile chat/collab mesajlarında
-- e-posta, telefon veya harici uygulama bağlantısı paylaşımını DB seviyesinde engeller.

create or replace function public.reject_external_contact_info()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_text text := coalesce(new.data->>'text', '');
  v_lower text := lower(v_text);
  v_match text;
begin
  if v_text = '' then
    return new;
  end if;

  if v_text ~ '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' then
    raise exception 'CONTACT_INFO_BLOCKED: e-posta adresi paylaşılamaz';
  end if;

  if v_lower ~ '(whatsapp|wa\.me|telegram|t\.me/|instagram|snapchat|discord|skype|messenger|facebook\.com|fb\.com/|twitter\.com/|x\.com/|linkedin\.com/in)' then
    raise exception 'CONTACT_INFO_BLOCKED: harici uygulama/bağlantı paylaşılamaz';
  end if;

  for v_match in
    select (regexp_matches(v_text, '\+?\d[\d\s().-]{7,}\d', 'g'))[1]
  loop
    if length(regexp_replace(v_match, '\D', '', 'g')) >= 9 then
      raise exception 'CONTACT_INFO_BLOCKED: telefon numarası paylaşılamaz';
    end if;
  end loop;

  return new;
end;
$$;

drop trigger if exists chat_messages_contact_guard on public.chat_messages;
create trigger chat_messages_contact_guard
  before insert on public.chat_messages
  for each row execute function public.reject_external_contact_info();

drop trigger if exists staff_collab_messages_contact_guard on public.staff_collab_messages;
create trigger staff_collab_messages_contact_guard
  before insert on public.staff_collab_messages
  for each row execute function public.reject_external_contact_info();
