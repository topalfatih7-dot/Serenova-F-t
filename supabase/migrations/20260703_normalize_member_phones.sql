-- TR telefonlarda çift ülke kodu düzeltmesi: +9090... → +905...
-- Yalnızca rakamları alıp +90 ile başlayan ve 12+ haneli kayıtları normalize eder.

update public.members
set phone = '+' || regexp_replace(
  case
    when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^9090'
      then substring(regexp_replace(phone, '\D', '', 'g') from 3)
    when regexp_replace(coalesce(phone, ''), '\D', '', 'g') ~ '^909\d'
         and length(regexp_replace(phone, '\D', '', 'g')) > 12
      then '90' || substring(regexp_replace(phone, '\D', '', 'g') from 5)
    else regexp_replace(phone, '\D', '', 'g')
  end,
  '^(\d+)$', '\1'
)
where phone is not null
  and phone <> ''
  and regexp_replace(phone, '\D', '', 'g') ~ '^9090';
