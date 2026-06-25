-- Demo yorumlar, örnek başarı hikâyeleri kaldır; blog yazılarını 800+ karaktere güncelle

-- Deneme / örnek site içerikleri
DELETE FROM public.site_content WHERE kind = 'testimonial';

DELETE FROM public.site_content
WHERE kind = 'success_story'
  AND data->>'name' IN ('Mehmet Y.', 'Elif K.', 'Zeynep A.', 'Can D.');

-- Blog yazılarını güncelle (varsa)
UPDATE public.posts SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{content}', to_jsonb(E'Dönüşüm denince çoğu kişinin aklına birkaç haftalık yoğun bir program gelir. Oysa gerçek ve kalıcı değişim, sürdürülebilir alışkanlıkların zaman içinde birikmesiyle oluşur. Hızlı sonuç vaat eden modalar genelde kısa sürede tükenir; asıl mesele, yıllarca sürebilecek bir yaşam düzenini kurmaktır.\n\n1. Küçük başlayın\nHedefinizi gözünüzde büyütmeyin. Haftada üç gün 20 dakikalık yürüyüş bile, hiç hareket etmemekten kat kat değerlidir. Başlangıçta sürekliliği yakalamak, yoğunluktan daha önemlidir.\n\n2. Ölçün ve takip edin\nİlerlemenizi görmek motivasyonun en güçlü kaynağıdır. Kilonuzu, enerji seviyenizi ve ruh halinizi düzenli kaydedin.\n\n3. Esneklik tanıyın\nMükemmeliyetçilik dönüşümün en büyük düşmanıdır. Bir gün programı kaçırmanız her şeyi mahvetmez.\n\n4. Destek alın\nYalnız yürünen yol uzundur. Bir koç, diyetisyen veya destekleyici bir topluluk zor günlerde sizi ayakta tutar.\n\n5. Süreci sevin\nSadece sonuca değil, yolculuğun kendisine odaklanın.\n\nUnutmayın: Yeni Form bir wellness ve koçluk platformudur, tıbbi tedavi sunmaz.'::text)),
      '{readMinutes}', '5'::jsonb
    ),
    '{updatedAt}', to_jsonb('2026-06-25'::text)
  )
WHERE id = 'b1000001-0000-4000-8000-000000000001';

UPDATE public.posts SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{content}', to_jsonb(E'Protein, kasların onarımından bağışıklık sistemine kadar vücudun pek çok temel işlevinde rol oynar. Ancak "ne kadar" ve "nasıl" soruları çoğu zaman kafa karıştırır.\n\nNe kadar protein?\nGenel sağlıklı yetişkinler için günlük 0,8–1,2 g/kg aralığı yaygın bir öneridir. Düzenli antrenman yapanlarda bu miktar artabilir.\n\nKaliteli kaynaklar\nYumurta, yoğurt, baklagiller, tavuk, balık ve mercimek gibi besinler hem protein hem de değerli mikro besinler sağlar.\n\nÖğünlere dağıtın\nTüm proteini tek öğünde almak yerine gün içine yaymak daha etkilidir.\n\nAbartmaya gerek yok\nDengeli bir tabak; protein, kompleks karbonhidrat, sağlıklı yağ ve bol sebzeden oluşur.\n\nBu içerik genel bilgilendirme amaçlıdır; bireysel plan için diyetisyeninize danışın.'::text)),
      '{readMinutes}', '5'::jsonb
    ),
    '{updatedAt}', to_jsonb('2026-06-25'::text)
  )
WHERE id = 'b1000002-0000-4000-8000-000000000002';

UPDATE public.posts SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{content}', to_jsonb(E'Antrenmana başlamak için pahalı ekipmanlara ihtiyacınız yok. Doğru tekniklerle vücut ağırlığınız harika bir başlangıç noktasıdır.\n\nIsınma (5 dakika)\nYerinde yürüyüş, kol çevirme ve hafif squat ile başlayın. Isınmayı asla atlamayın.\n\nTemel devre (2–3 tur)\n• Squat — 12 tekrar\n• Diz üstü şınav — 8 tekrar\n• Köprü — 15 tekrar\n• Plank — 20 saniye\n• Yerinde yüksek diz — 30 saniye\n\nTurlar arasında 60 saniye dinlenin. İlk haftalarda 2 tur yeterli.\n\nSoğuma\nBitirdikten sonra birkaç dakika esneme yapın.\n\nDinleme ilkesi\nKeskin ağrı hissederseniz durun. Kronik rahatsızlığınız varsa doktorunuza danışın.'::text)),
      '{readMinutes}', '4'::jsonb
    ),
    '{updatedAt}', to_jsonb('2026-06-25'::text)
  )
WHERE id = 'b1000003-0000-4000-8000-000000000003';

UPDATE public.posts SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{content}', to_jsonb(E'Beslenme ve egzersiz kadar önemli olmasına rağmen uyku çoğu zaman göz ardı edilir. Kaliteli uyku, hedeflerinize ulaşmanızın görünmeyen kahramanıdır.\n\nNeden önemli?\nUyku sırasında vücut onarılır, hormonlar dengelenir. Yetersiz uyku iştah artışına ve düşük enerjiye yol açabilir.\n\nDaha iyi uyku için\n• Her gün aynı saatte yatıp kalkın.\n• Yatmadan bir saat önce ekranları bırakın.\n• Yatak odanızı serin, karanlık ve sessiz tutun.\n• Akşam geç saatlerde kafein ve ağır öğünlerden kaçının.\n\nRutin oluşturun\nIlık duş, hafif esneme veya nefes egzersizi bedeninize dinlenme sinyali verir.\n\nSürekli uyku sorunları yaşıyorsanız bir sağlık profesyoneline danışın.'::text)),
      '{readMinutes}', '5'::jsonb
    ),
    '{updatedAt}', to_jsonb('2026-06-25'::text)
  )
WHERE id = 'b1000004-0000-4000-8000-000000000004';

UPDATE public.posts SET
  data = jsonb_set(
    jsonb_set(
      jsonb_set(data, '{content}', to_jsonb(E'Online wellness desteği, doğru kurgulandığında yüz yüze danışmanlıkla aynı disiplini daha erişilebilir bir forma taşır.\n\nEsneklik ve süreklilik\nYoğun iş temposu yüz yüze görüşmeleri zorlaştırabilir. Video görüşme randevuları programınıza devam etmenizi sağlar.\n\nKişisel program takibi\nÜye panelinizde antrenman ve beslenme programlarınızı görebilir, ilerlemenizi takip edebilirsiniz.\n\nHesap verebilirlik\nDüzenli görüşmeler motivasyonu yüksek tutar.\n\nYeni Form farkı\nBasic paketle ücretsiz başlayabilir; Diyet ve Spor paketlerinde uzman görüşmeleri, Kurucu ve VIP paketlerde kapsamlı destek sunulur. Platform tıbbi tedavi sunmaz; özel sağlık durumlarında doktorunuza danışın.'::text)),
      '{readMinutes}', '5'::jsonb
    ),
    '{updatedAt}', to_jsonb('2026-06-25'::text)
  )
WHERE id = 'b1000005-0000-4000-8000-000000000005';
