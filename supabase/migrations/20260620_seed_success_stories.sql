-- Örnek onaylı başarı hikayeleri (landing + /stories)

insert into public.site_content (kind, sort, data)
select 'success_story', 1, '{"name":"Mehmet Y.","duration":"12 hafta","highlight":"Premium koç desteğiyle formunu buldu","story":"Altın paketle koçumla haftalık görüntülü görüşmeler yaptık. Program bana göre güncellendi, takılınca destek ekibine yazdım anında yanıt aldım. Bel ve omuz ağrılarım azaldı, günde daha enerjik uyanıyorum.","consent":true,"approved":true}'::jsonb
where not exists (
  select 1 from public.site_content
  where kind = 'success_story' and data->>'name' = 'Mehmet Y.'
);

insert into public.site_content (kind, sort, data)
select 'success_story', 2, '{"name":"Elif K.","duration":"8 hafta","highlight":"Evde düzenli antrenman alışkanlığı","story":"Evden çıkmadan uygulayabileceğim egzersizler tam bana göreydi. Takvim ve bildirimler sayesinde hiçbir seansı kaçırmadım. Sekiz haftada kıyafetlerimin daha rahat oturduğunu hissettim, en önemlisi motivasyonumu kaybetmedim.","consent":true,"approved":true}'::jsonb
where not exists (
  select 1 from public.site_content
  where kind = 'success_story' and data->>'name' = 'Elif K.'
);

insert into public.site_content (kind, sort, data)
select 'success_story', 3, '{"name":"Zeynep A.","duration":"6 hafta","highlight":"Diyetisyen eşliğinde beslenme düzeni","story":"Gümüş pakette diyetisyenimle aylık görüşmeler planladık. Öğünlerimi uygulamadan kaydettim, AI kalori analizi işimi kolaylaştırdı. Altı haftada şeker tüketimimi ciddi azalttım ve kendimi hafif hissediyorum.","consent":true,"approved":true}'::jsonb
where not exists (
  select 1 from public.site_content
  where kind = 'success_story' and data->>'name' = 'Zeynep A.'
);

insert into public.site_content (kind, sort, data)
select 'success_story', 4, '{"name":"Can D.","duration":"14 hafta","highlight":"Video görüşmelerle sürdürülebilir dönüşüm","story":"Platinum üyelikle hem koç hem diyetisyen desteği aldım. Video görüşmeler sayesinde evden çıkmadan profesyonel takip mümkün oldu. On dört haftada sadece kilo vermekle kalmadım, uyku düzenim ve stres yönetimim de iyileşti.","consent":true,"approved":true}'::jsonb
where not exists (
  select 1 from public.site_content
  where kind = 'success_story' and data->>'name' = 'Can D.'
);
