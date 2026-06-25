export const BLOG_CATEGORIES = ['Beslenme', 'Antrenman', 'Motivasyon', 'Yaşam']

export const DEFAULT_POSTS = [
  {
    id: 'post-welcome',
    title: 'Sürdürülebilir Dönüşümün 5 Temel İlkesi',
    category: 'Motivasyon',
    excerpt: 'Kalıcı değişim radikal diyetlerle değil, küçük ve tutarlı adımlarla gelir. İşte yolculuğunuzu sürdürülebilir kılacak beş ilke.',
    author: 'Yeni Form Ekibi',
    readMinutes: 5,
    accent: 'brand',
    published: true,
    createdAt: '2026-05-02',
    content: `Dönüşüm denince çoğu kişinin aklına birkaç haftalık yoğun bir program gelir. Oysa gerçek ve kalıcı değişim, sürdürülebilir alışkanlıkların zaman içinde birikmesiyle oluşur. Hızlı sonuç vaat eden modalar genelde kısa sürede tükenir; asıl mesele, yıllarca sürebilecek bir yaşam düzenini kurmaktır.

1. Küçük başlayın
Hedefinizi gözünüzde büyütmeyin. Haftada üç gün 20 dakikalık yürüyüş bile, hiç hareket etmemekten kat kat değerlidir. Başlangıçta sürekliliği yakalamak, yoğunluktan daha önemlidir. Her hafta küçük bir adım ekleyerek ilerleyin.

2. Ölçün ve takip edin
İlerlemenizi görmek motivasyonun en güçlü kaynağıdır. Kilonuzu, enerji seviyenizi ve ruh halinizi düzenli olarak kaydedin. Yeni Form panelindeki grafikler tam da bunun için var; veriye dayalı kararlar almak sizi yanıltmaz.

3. Esneklik tanıyın
Mükemmeliyetçilik dönüşümün en büyük düşmanıdır. Bir gün programı kaçırmanız her şeyi mahvetmez. Önemli olan ertesi gün kaldığınız yerden devam edebilmektir. Esnek bir plan, katı bir plana göre çok daha uzun ömürlüdür.

4. Destek alın
Yalnız yürünen yol uzundur. Bir koç, diyetisyen veya destekleyici bir topluluk, zor günlerde sizi ayakta tutar. Profesyonel rehberlik, kendi kendinize deneme-yanılma yapmaktan hem daha güvenli hem daha verimlidir.

5. Süreci sevin
Sadece sonuca değil, yolculuğun kendisine odaklanın. Antrenman sonrası hissettiğiniz enerjiyi, daha iyi uykuyu ve artan özgüveni fark edin. Küçük kazanımları kutlamak, uzun vadede motivasyonu canlı tutar.

Unutmayın: Yeni Form bir wellness ve koçluk platformudur, tıbbi tedavi sunmaz. Sağlık durumunuzla ilgili kararlarda mutlaka doktorunuza danışın.`,
  },
  {
    id: 'post-protein',
    title: 'Protein Hakkında Bilmeniz Gereken Her Şey',
    category: 'Beslenme',
    excerpt: 'Ne kadar protein almalısınız, hangi kaynaklar daha iyi ve öğünlere nasıl dağıtmalısınız? Dengeli beslenmenin yapı taşını inceliyoruz.',
    author: 'Dyt. Yeni Form',
    readMinutes: 5,
    accent: 'sage',
    published: true,
    createdAt: '2026-05-10',
    content: `Protein, kasların onarımından bağışıklık sistemine kadar vücudun pek çok temel işlevinde rol oynar. Ancak "ne kadar" ve "nasıl" soruları çoğu zaman kafa karıştırır. Doğru bilgiyle hareket etmek, gereksiz kısıtlamalardan veya eksik alımdan kaçınmanızı sağlar.

Ne kadar protein?
Genel sağlıklı yetişkinler için günlük 0,8–1,2 g/kg aralığı yaygın bir öneridir. Düzenli antrenman yapanlarda bu miktar 1,4–1,8 g/kg'a kadar çıkabilir. Kişisel ihtiyacınız yaşa, aktivite düzeyinize ve hedeflerinize göre değişir; tek bir rakam herkese uymaz.

Kaliteli kaynaklar
Yumurta, yoğurt, baklagiller, tavuk, balık ve mercimek gibi besinler hem protein hem de değerli mikro besinler sağlar. Bitkisel ve hayvansal kaynakları dengeli biçimde birleştirmek, hem çeşitlilik hem de sürdürülebilirlik açısından iyi bir stratejidir.

Öğünlere dağıtın
Tüm proteini tek öğünde almak yerine gün içine yaymak, tokluk hissi ve kas onarımı açısından daha etkilidir. Her ana öğünde bir protein kaynağı bulundurmaya çalışın; ara öğünlerde yoğurt veya kuruyemiş gibi pratik seçenekler işinizi kolaylaştırır.

Abartmaya gerek yok
Daha fazla protein her zaman daha iyi değildir. Dengeli bir tabak; protein, kompleks karbonhidrat, sağlıklı yağ ve bol sebzeden oluşur. Aşırı protein tüketimi böbrek yükünü artırabilir; özellikle kronik bir rahatsızlığınız varsa diyetisyeninize danışın.

Bu içerik genel bilgilendirme amaçlıdır ve kişiye özel tıbbi beslenme tedavisi yerine geçmez. Bireysel plan için diyetisyeninize danışın.`,
  },
  {
    id: 'post-home-workout',
    title: 'Evde Ekipmansız Başlangıç Antrenmanı',
    category: 'Antrenman',
    excerpt: 'Spor salonuna gitmeden, kendi vücut ağırlığınızla güç ve dayanıklılık kazanabilirsiniz. İşte yeni başlayanlar için basit bir rutin.',
    author: 'Koç Yeni Form',
    readMinutes: 4,
    accent: 'gold',
    published: true,
    createdAt: '2026-05-18',
    content: `Antrenmana başlamak için pahalı ekipmanlara ya da salon üyeliklerine ihtiyacınız yok. Doğru tekniklerle, kendi vücut ağırlığınız harika bir başlangıç noktası olabilir. Evde antrenman; zaman tasarrufu, düşük maliyet ve düzenli uygulama kolaylığı sunar.

Isınma (5 dakika)
Yerinde yürüyüş, kol çevirme ve hafif squat hareketleriyle kaslarınızı hazırlayın. Isınmayı asla atlamayın; soğuk kaslarla çalışmak sakatlık riskini artırır. Nabzınızı kademeli olarak yükseltmek, antrenman verimini de artırır.

Temel devre (2–3 tur)
• Squat — 12 tekrar: Kalça ve bacak kaslarını güçlendirir.
• Diz üstü şınav — 8 tekrar: Göğüs ve kol kaslarına yük bindirir.
• Köprü (glute bridge) — 15 tekrar: Kalça kaslarını aktive eder.
• Plank — 20 saniye: Core stabilitesini geliştirir.
• Yerinde yüksek diz — 30 saniye: Kardiyovasküler dayanıklılığı artırır.

Turlar arasında 60 saniye dinlenin. İlk haftalarda 2 tur yeterli; vücudunuz güçlendikçe tur sayısını veya tekrarları kademeli artırabilirsiniz.

Soğuma
Bitirdikten sonra birkaç dakika esneme yapın. Bacak arkası, kalça ve sırt esnemelerine öncelik verin. Soğuma, kas ağrısını azaltır ve toparlanmayı hızlandırır.

Dinleme ilkesi
Ağrı ile zorlanmayı karıştırmayın. Keskin bir ağrı hissederseniz durun. Yaralanma veya kronik rahatsızlığınız varsa programa başlamadan önce doktorunuza danışın.`,
  },
  {
    id: 'post-sleep',
    title: 'Uyku: Görmezden Gelinen Sağlık Süper Gücü',
    category: 'Yaşam',
    excerpt: 'İyi bir uyku; iştahtan enerjiye, ruh halinden toparlanmaya kadar her şeyi etkiler. Uyku kalitenizi artıracak pratik ipuçları.',
    author: 'Yeni Form Ekibi',
    readMinutes: 5,
    accent: 'brand',
    published: true,
    createdAt: '2026-05-27',
    content: `Beslenme ve egzersiz kadar önemli olmasına rağmen uyku çoğu zaman göz ardı edilir. Oysa kaliteli uyku, hedeflerinize ulaşmanızın görünmeyen kahramanıdır. Yetersiz uyku; iştah hormonlarını, stres tepkisini ve toparlanma sürecini doğrudan etkiler.

Neden bu kadar önemli?
Uyku sırasında vücut onarılır, hormonlar dengelenir ve zihin kendini toparlar. Yetersiz uyku; iştah artışına, düşük enerjiye ve motivasyon kaybına yol açabilir. Antrenman yapanlar için uyku, kas onarımının ve performans artışının temelidir.

Daha iyi uyku için
• Her gün aynı saatte yatıp kalkmaya çalışın; hafta sonu bile rutini bozmamak biyolojik saatinizi düzenler.
• Yatmadan en az bir saat önce ekranları bırakın; mavi ışık melatonin üretimini baskılar.
• Yatak odanızı serin (18–20°C), karanlık ve sessiz tutun.
• Akşam geç saatlerde kafein ve ağır öğünlerden kaçının.
• Gün içinde doğal ışığa çıkmak, gece uykusunun kalitesini artırır.

Rutin oluşturun
Kısa bir akşam rutini — ılık duş, hafif esneme veya birkaç dakika nefes egzersizi — bedeninize "artık dinlenme zamanı" sinyalini verir. Tutarlı bir rutin, uykuya geçişi kolaylaştırır ve uykusuzluk döngüsünü kırar.

Sürekli uyku sorunları yaşıyorsanız bu, altta yatan bir sağlık durumunun işareti olabilir; bir sağlık profesyoneline danışmanız önerilir.`,
  },
  {
    id: 'post-online-coaching',
    title: 'Online Koçluk ve Diyetisyen Desteği Neden İşe Yarar?',
    category: 'Yaşam',
    excerpt: 'Yüz yüze seanslara alternatif olarak online destek; esnek randevu, kişisel program takibi ve sürdürülebilir alışkanlıklar için güçlü bir model sunar.',
    author: 'Yeni Form Ekibi',
    readMinutes: 5,
    accent: 'sage',
    published: true,
    createdAt: '2026-06-10',
    content: `Online wellness desteği son yıllarda hızla yaygınlaştı — ve bunun iyi bir nedeni var: doğru kurgulandığında, yüz yüze danışmanlıkla aynı disiplini daha erişilebilir bir forma taşır. Teknoloji, mesafe ve zaman engellerini ortadan kaldırarak sürdürülebilir sağlık alışkanlıklarını destekler.

Esneklik ve süreklilik
Yoğun iş temposu, şehir trafiği veya farklı ilçede yaşamak yüz yüze görüşmeleri zorlaştırabilir. Online koçluk ve diyetisyen seansları; evden, ofisten veya seyahat halindeyken bile programınıza devam etmenizi sağlar. Yeni Form'da video görüşme randevuları, planlanmış seans penceresi içinde güvenli şekilde gerçekleşir.

Kişisel program takibi
Sadece konuşmak yetmez; uygulama önemlidir. Üye panelinizde antrenman ve beslenme programlarınızı görebilir, ilerlemenizi takip edebilir ve koçunuzla veya diyetisyeninizle aynı veri üzerinden konuşabilirsiniz. Bu, "ne yapmalıyım?" sorusunu her gün yanıtlar.

Hesap verebilirlik
Düzenli görüşmeler ve panel üzerinden görev takibi, motivasyonu yüksek tutar. Özellikle hedef kilo, performans veya yaşam tarzı değişikliği gibi orta-uzun vadeli hedeflerde, haftalık check-in'ler kritik fark yaratır.

Kimler için uygun?
• Yoğun çalışan profesyoneller
• Şehir dışında veya seyahat edenler
• Spor salonuna gidemeyen ama evde antrenman yapabilenler
• Beslenme düzenini sistematik kurmak isteyenler

Yeni Form farkı
Basic paketle ücretsiz başlayabilir; Diyet ve Spor paketlerinde uzman görüşmeleri, Kurucu ve VIP paketlerde kapsamlı koç ve diyetisyen desteği sunulur. Tüm süreç tek platformda: kayıt, sağlık analizi, programlar ve randevular.

Unutmayın: Platform tıbbi tedavi sunmaz. Kronik hastalık, hamilelik veya özel sağlık durumlarınız varsa doktorunuza danışın; online destek bu süreçte tamamlayıcı bir rehberlik sağlar.`,
  },
]
