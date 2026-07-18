# Domain — Health Test Options (LOCK)

Auto-extracted option arrays. Do not invent options.

Source: healthTestSections.js + healthTestDietitianSections.js

## `general` — Genel Değerlendirme

### wellbeing (`emoji`, required)
Son 2 hafta içinde kendinizi genel olarak nasıl hissettiniz?

| value | label | emoji |
|-------|-------|-------|
| very_low | Çok kötü | 😞 |
| low | Kötü | 🙁 |
| medium | Ne iyi ne kötü | 😐 |
| good | İyi | 🙂 |
| excellent | Çok iyi | 😁 |

### energy (`emoji`, required)
Son 2 hafta içinde gün içindeki enerji seviyenizi nasıl değerlendirirsiniz?

| value | label | emoji |
|-------|-------|-------|
| very_low | Çok düşük | 🔋 |
| low | Düşük | 🔋 |
| moderate | Orta | 🔋 |
| high | Yüksek | 🔋 |
| very_high | Çok yüksek | 🔋 |

### motivation (`scale`, required)
Sağlıklı yaşam hedeflerinize ulaşmak için kendinizi ne kadar motive hissediyorsunuz?

_No options (free text / time / etc.)_

### biggestBarrier (`single`, required)
Sağlık hedeflerinize ulaşmanızın önündeki en büyük engel nedir?

| value | label | emoji |
|-------|-------|-------|
| time | Zaman bulamıyorum. |  |
| motivation | Motivasyonumu koruyamıyorum. |  |
| how_to_start | Nasıl başlayacağımı bilmiyorum. |  |
| nutrition | Düzenli beslenemiyorum. |  |
| exercise | Egzersiz yapamıyorum. |  |
| stress_eating | Stres veya duygusal yeme yaşıyorum. |  |
| health_issues | Sağlık sorunlarım var. |  |
| other | Diğer. |  |

### concentration (`single`, required)
Günlük yaşamınızda dikkatinizi toplamakta zorlanıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| never | Hiç |  |
| rarely | Nadiren |  |
| sometimes | Bazen |  |
| often | Sık |  |
| always | Çok sık |  |

### anxiety (`single`, required)
Son 2 hafta içinde kendinizi ne kadar endişeli hissettiniz?

| value | label | emoji |
|-------|-------|-------|
| never | Hiç |  |
| rarely | Nadiren |  |
| sometimes | Bazen |  |
| often | Sık |  |
| always | Çok sık |  |

### dailyStressImpact (`single`, required)
Son 2 hafta içinde stresin günlük yaşamınızı ne kadar etkilediğini düşünüyorsunuz?

| value | label | emoji |
|-------|-------|-------|
| none | Hiç etkilemiyor |  |
| low | Az etkiliyor |  |
| moderate | Orta düzeyde etkiliyor |  |
| high | Oldukça etkiliyor |  |
| very_high | Çok fazla etkiliyor |  |

### stressCoping (`single`, required)
Stresle başa çıkabildiğinizi düşünüyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| always | Her zaman |  |
| often | Çoğu zaman |  |
| sometimes | Bazen |  |
| rarely | Nadiren |  |
| never | Hiç |  |

### socialSupport (`single`, required)
Sağlıklı yaşam hedefleriniz konusunda ailenizden veya yakın çevrenizden destek görüyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| strong | Güçlü destek var |  |
| partial | Kısmi destek var |  |
| limited | Sınırlı destek var |  |
| none | Destek yok |  |

### readinessToChange (`single`, required)
Yaşam tarzı değişikliklerine ne kadar hazırsınız?

| value | label | emoji |
|-------|-------|-------|
| not_ready | Henüz değişime hazır değilim. |  |
| thinking | Değişmeyi düşünüyorum. |  |
| ready | Hazırım, yakında başlayacağım. |  |
| started | Değişime başladım. |  |
| maintaining | Değişiklikleri düzenli olarak sürdürüyorum. |  |

### painScale (`scale`, required)
Son bir hafta içindeki genel ağrı seviyenizi nasıl değerlendirirsiniz?

_No options (free text / time / etc.)_

### lifeQuality (`emoji`, required)
Son zamanlarda yaşam kalitenizi nasıl değerlendirirsiniz?

| value | label | emoji |
|-------|-------|-------|
| 1 | Çok düşük | ★ |
| 2 | Düşük | ★★ |
| 3 | Orta | ★★★ |
| 4 | İyi | ★★★★ |
| 5 | Çok iyi | ★★★★★ |

## `medical` — Tıbbi Geçmiş

### chronicConditions (`multi`, required)
Tanı almis kronik rahatsızlıklarınız var mi?

| value | label | emoji |
|-------|-------|-------|
| none | Yok |  |
| hypertension | Yüksek tansiyon |  |
| diabetes | Diyabet |  |
| thyroid | Tiroid hastalığı |  |
| pcos | PKOS |  |
| asthma | Astım |  |
| other | Diğer |  |

### medications (`single`, required)
Düzenli kullandiginiz ilaç var mi?

| value | label | emoji |
|-------|-------|-------|
| none | Hayır |  |
| regular | Evet, düzenli |  |
| occasional | Ara sira |  |

### familyHistory (`multi`, required)
Ailenizde aşağıdaki rahatsızlıklardan hangileri var?

| value | label | emoji |
|-------|-------|-------|
| none | Bilinmiyor / Yok |  |
| diabetes | Diyabet |  |
| obesity | Obezite |  |
| heartDisease | Kalp hastalığı |  |
| stroke | İnme |  |
| cancer | Kanser |  |

### surgeries (`single`, required)
Gecirdiginiz ameliyat var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### hospitalVisits (`single`)
Son 12 ayda hastane aciline basvurdunuz mu?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| once | 1 kez |  |
| multiple | Birden fazla |  |

### lastBloodWork (`single`, required)
Son kapsamli kan tahlilinizi ne zaman yaptırdınız?

| value | label | emoji |
|-------|-------|-------|
| last_3_months | Son 3 ay içinde |  |
| 3_12_months | 3-12 ay once |  |
| over_year | 1 yıldan uzun |  |
| never | Hiç yaptirmadim |  |

### supplements (`multi`)
Düzenli kullandiginiz takviyeler hangileri?

| value | label | emoji |
|-------|-------|-------|
| none | Kullanmiyorum |  |
| vitaminD | D vitamini |  |
| omega3 | Omega-3 |  |
| magnesium | Magnezyum |  |
| proteinPowder | Protein tozu |  |
| probiotic | Probiyotik |  |
| other | Diğer |  |

### mentalHealthDiagnosis (`single`)
Bir ruh sagligi tanı veya tedavi geçmişiniz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| past | Geçmişte vardi |  |
| ongoing | Şu anda devam ediyor |  |

### doctorClearance (`single`, required)
Egzersiz veya kilo yonetimi programi icin doktor onayi aldiniz mi?

| value | label | emoji |
|-------|-------|-------|
| yes | Evet |  |
| no_need | Gerek gormedim |  |
| not_yet | Henüz almadim |  |

### bloodPressureIssues (`single`)
Tansiyon dalgalanmasi sorunu yasiyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| sometimes | Ara sira |  |
| yes | Evet, sık |  |

### digestiveDisorders (`single`)
Tanı almis sindirim sistemi rahatsizliginiz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Yok |  |
| ibs | IBS |  |
| reflux | Reflu |  |
| gastritis | Gastrit |  |
| other | Diğer |  |

### thyroidStatus (`single`)
Tiroid degerlerinizle ilgili bilinen bir durum var mi?

| value | label | emoji |
|-------|-------|-------|
| normal | Bilinen sorun yok |  |
| hypo | Hipotiroidi |  |
| hyper | Hipertiroidi |  |
| unknown | Bilmiyorum |  |

### currentComplaints (`text`)
Şu an sizi en çok zorlayan sağlık sıkayetini kisaça yaziniz

_No options (free text / time / etc.)_

## `physical` — Fiziksel Kapasite

### injuries (`single`, required)
Son 2 yıl içinde hareket etmenizi kısıtlayan bir sakatlık veya ortopedik sorun yaşadınız mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes_recovered | Evet, tamamen iyileşti. |  |
| yes_partial | Evet, kısmen devam ediyor. |  |
| yes_ongoing | Evet, hâlâ devam ediyor. |  |

### injuryRegions (`multi`, required)
Sakatlık hangi bölgedeydi?

| value | label | emoji |
|-------|-------|-------|
| neck | Boyun |  |
| shoulder | Omuz |  |
| elbow | Dirsek |  |
| hand_wrist | El / Bilek |  |
| upper_back | Sırt |  |
| low_back | Bel |  |
| hip | Kalça |  |
| knee | Diz |  |
| ankle | Ayak bileği |  |
| foot | Ayak |  |
| other | Diğer |  |

### injuryCause (`single`, required)
Sakatlığın nedeni neydi?

| value | label | emoji |
|-------|-------|-------|
| sport | Spor |  |
| fall | Düşme |  |
| traffic | Trafik kazası |  |
| work | İş kazası |  |
| post_surgery | Ameliyat sonrası |  |
| unknown | Bilinmiyor |  |
| other | Diğer |  |

### injuryLimitation (`single`, required)
Şu anda hareketlerinizi kısıtlıyor mu?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| mild | Biraz |  |
| moderate | Orta düzeyde |  |
| severe | Çok |  |

### injuryDoctorRestriction (`single`, required)
Doktor tarafından egzersiz kısıtlamanız var mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### activityFrequency (`single`, required)
Haftada kaç gün düzenli fiziksel aktivite yapiyorsunuz?

| value | label | emoji |
|-------|-------|-------|
| 0 | 0 gün |  |
| 1_2 | 1-2 gün |  |
| 3_4 | 3-4 gün |  |
| 5_plus | 5+ gün |  |

### trainingHistoryYears (`single`, required)
Toplam düzenli antrenman geçmişiniz ne kadar?

| value | label | emoji |
|-------|-------|-------|
| none | Yok |  |
| under_6m | 6 aydan az |  |
| 6m_2y | 6 ay - 2 yıl |  |
| 2y_plus | 2 yıl+ |  |

### currentActivityTypes (`multi`, required)
Şu anda yaptiginiz aktiviteler hangileri?

| value | label | emoji |
|-------|-------|-------|
| walking | Yürüyüş |  |
| running | Koşu |  |
| strength | Kuvvet antrenmani |  |
| pilates | Pilates/Yoga |  |
| cycling | Bisıklet |  |
| none | Düzenli aktivitem yok |  |

### movementQuality (`single`)
Temel hareketlerde koordinasyonunuzu nasıl değerlendirirsiniz?

| value | label | emoji |
|-------|-------|-------|
| weak | Zayif |  |
| fair | Gelişmeye açık |  |
| good | İyi |  |
| very_good | Çok iyi |  |

### flexibilityLevel (`single`, required)
Esneklik seviyeniz nasıl?

| value | label | emoji |
|-------|-------|-------|
| very_low | Çok düşük |  |
| low | Düşük |  |
| medium | Orta |  |
| high | Yüksek |  |

### cardioCapacity (`single`, required)
10-15 dk tempolu yürüyüşte nefes durumunuz nasıl?

| value | label | emoji |
|-------|-------|-------|
| very_hard | Çok zorlaniyorum |  |
| hard | Zorlaniyorum |  |
| manageable | İdare ediyorum |  |
| easy | Rahatim |  |

### sportsHistory (`multi`)
Geçmişte düzenli yaptiginiz sporlar hangileri?

| value | label | emoji |
|-------|-------|-------|
| football | Futbol |  |
| basketball | Basketbol |  |
| swimming | Yüzme |  |
| martialArts | Dövüş sporlari |  |
| athletics | Atletizm |  |
| none | Yok |  |

### equipmentAccess (`multi`, required)
Antrenman icin hangi ekipmanlara erisiminiz var?

| value | label | emoji |
|-------|-------|-------|
| bodyweight | Sadece vücut agirligi |  |
| dumbbells | Dambil |  |
| bands | Direnc bandi |  |
| cardioMachine | Kondisyon cihazi |  |
| gym | Tam donanimli spor salonu |  |

### preferredTrainingDays (`multi`, required)
Antrenman icin uygün günleriniz hangileri?

| value | label | emoji |
|-------|-------|-------|
| monday | Pazartesi |  |
| tuesday | Salı |  |
| wednesday | Çarşamba |  |
| thursday | Perşembe |  |
| friday | Cuma |  |
| saturday | Cumartesi |  |
| sunday | Pazar |  |

### sessionDurationGoal (`single`, required)
Tek bir antrenmana ayirabileceginiz sure ne kadar?

| value | label | emoji |
|-------|-------|-------|
| 15_25 | 15-25 dk |  |
| 30_40 | 30-40 dk |  |
| 45_60 | 45-60 dk |  |
| 60_plus | 60+ dk |  |

### trainingLocation (`single`, required)
Nerede antrenman yapmayi tercih edersiniz?

| value | label | emoji |
|-------|-------|-------|
| home | Evde |  |
| gym | Spor salonunda |  |
| outdoor | Açık alanda |  |
| mixed | Karışık |  |

### previousCoachExperience (`single`)
Daha once bir antrenörle calistiniz mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| online | Evet, online |  |
| face_to_face | Evet, yüz yüze |  |

### exerciseContraindications (`single`, required)
Yapmanız önerilen hareket/egzersiz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Yok |  |
| yes | Var |  |

### painAreas (`multi`)
Düzenli ağrı yaşadığınız bölgeler hangileri?

| value | label | emoji |
|-------|-------|-------|
| lowback | Bel |  |
| neck | Boyun |  |
| knee | Diz |  |
| shoulder | Omuz |  |
| hip | Kalça |  |
| ankle | Ayak bileği |  |
| wrist | El bileği |  |

### performanceGoal (`text`, required)
Önümüzdeki 3 ay icin en öncelikli fiziksel hedefiniz nedir?

_No options (free text / time / etc.)_

## `lifestyle` — Yaşam Tarzi

### sittingHours (`single`, required)
Günluk ortalama kaç saat oturuyorsunuz?

| value | label | emoji |
|-------|-------|-------|
| under_4 | 4 saatten az |  |
| 4_6 | 4-6 saat |  |
| 7_9 | 7-9 saat |  |
| 10_plus | 10 saat+ |  |

### smoking (`single`, required)
Sigara kullanıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| never | Hiç kullanmadim |  |
| former | Biraktim |  |
| occasional | Ara sira |  |
| daily | Her gün |  |

### alcohol (`single`, required)
Alkol tüketim sıkliginiz nasıl?

| value | label | emoji |
|-------|-------|-------|
| none | Hiç |  |
| monthly | Ayda 1-2 kez |  |
| weekly | Haftada 1-2 kez |  |
| frequent | Haftada 3+ kez |  |

### teaCoffee (`single`, required)
Günluk cay/kahve tüketiminiz ne kadar?

| value | label | emoji |
|-------|-------|-------|
| 0_1 | 0-1 fincan |  |
| 2_3 | 2-3 fincan |  |
| 4_5 | 4-5 fincan |  |
| 6_plus | 6+ fincan |  |

### travelFrequency (`single`)
Is veya ozel nedenlerle şehir dışı seyahat sıkliginiz?

| value | label | emoji |
|-------|-------|-------|
| rare | Çok nadir |  |
| monthly | Ayda 1 civari |  |
| biweekly | Ayda 2-3 |  |
| weekly | Haftalik |  |

### substanceUse (`single`, required)
Sigara dışında madde kullaniminiz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| past | Geçmişte vardi |  |
| yes | Evet |  |

### shiftWork (`single`, required)
Vardiyali veya duzensiz saatlerde calisiyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| sometimes | Dönemsel |  |
| yes | Evet, düzenli |  |

### dailySteps (`single`)
Günluk ortalama adim sayiniz nedir?

| value | label | emoji |
|-------|-------|-------|
| under_3000 | 3000 altı |  |
| 3000_6000 | 3000-6000 |  |
| 6000_9000 | 6000-9000 |  |
| 9000_plus | 9000+ |  |

### screenTime (`single`)
Günluk ekran başında geçirdiğiniz toplam sure ne kadar?

| value | label | emoji |
|-------|-------|-------|
| under_3 | 3 saatten az |  |
| 3_5 | 3-5 saat |  |
| 6_8 | 6-8 saat |  |
| 9_plus | 9 saat+ |  |

### exercisePreferences (`multi`, required)
Hangi egzersiz turleri size daha keyifli geliyor?

| value | label | emoji |
|-------|-------|-------|
| walking | Yürüyüş |  |
| strength | Kuvvet |  |
| group | Grup dersleri |  |
| mindBody | Yoga/Pilates |  |
| shortHome | Kisa ev antrenmani |  |

### exerciseBarriers (`multi`, required)
Düzenli egzersiz yapmanizi en çok zorlayan etkenler neler?

| value | label | emoji |
|-------|-------|-------|
| time | Zaman yetersizligi |  |
| motivation | Motivasyon düşüklugu |  |
| pain | Ağrı/sakatlık korkusu |  |
| knowledge | Nasıl yapacagimi bilmiyorum |  |
| environment | Uygün ortam yok |  |

### commuteType (`single`)
Günluk ulaşım sekli en çok hangisi?

| value | label | emoji |
|-------|-------|-------|
| car | Araç |  |
| public | Toplu taşıma |  |
| walk | Yürüyerek |  |
| mixed | Karışık |  |

## `women` — Kadin Sagligi

### pregnancy (`single`, required)
Şu an hamilelik durumu var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |
| planning | Planliyorum |  |

### menstrualRegular (`single`, required)
Adet dongünuz genellikle düzenli mi?

| value | label | emoji |
|-------|-------|-------|
| regular | Düzenli |  |
| irregular | Duzensiz |  |
| absent | Uzun suredir olmuyor |  |

### pmsSymptoms (`multi`)
Adet oncesi donemde hangi belirtileri sık yasiyorsunuz?

| value | label | emoji |
|-------|-------|-------|
| none | Belirgin yok |  |
| bloating | Sislik |  |
| cravings | Yeme ataklari |  |
| mood_swings | Ruh hali değişimi |  |
| fatigue | Yorgünluk |  |
| headache | Bas ağrısi |  |

### contraceptionMethod (`single`)
Dogum kontrol yontemi kullanıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| none | Kullanmiyorum |  |
| barrier | Bariyer yontemleri |  |
| hormonal | Hormonal yontem |  |
| iud | Spiral (Ria) |  |
| other | Diğer |  |

### menopauseStatus (`single`)
Menopoz durumunuz nedir?

| value | label | emoji |
|-------|-------|-------|
| not_applicable | Uygün degil |  |
| premenopause | Premenopoz |  |
| perimenopause | Perimenopoz |  |
| postmenopause | Postmenopoz |  |

### ironDeficiencyHistory (`single`)
Demir eksıkligi veya anemi geçmişiniz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Yok |  |
| past | Geçmişte vardi |  |
| ongoing | Şu an devam ediyor |  |

### cyclePain (`single`)
Adet doneminde ağrılariniz ne düzeyde olur?

| value | label | emoji |
|-------|-------|-------|
| none | Yok |  |
| mild | Hafif |  |
| moderate | Orta |  |
| severe | Siddetli |  |

### fertilityPlan (`single`)
Önümüzdeki 12 ay içinde gebelik plani var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| maybe | Belki |  |
| yes | Evet |  |

## `men` — Erkek Sagligi

### prostateSymptoms (`single`, required)
İdrar yapma duzeniyle ilgili prostat kaynakli sıkayetiniz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| mild | Hafif |  |
| moderate | Orta |  |
| severe | Belirgin |  |

### testosteroneConcerns (`single`, required)
Düşük testosteronla iliskili belirtiler yasiyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| suspect | Şüpheleniyorum |  |
| diagnosed | Tanı aldim |  |

### maleScreening (`single`, required)
Son erkek sagligi kontrolunuzu ne zaman yaptırdınız?

| value | label | emoji |
|-------|-------|-------|
| last_year | Son 1 yıl içinde |  |
| 1_3_years | 1-3 yıl once |  |
| over_3_years | 3 yıldan uzun |  |
| never | Hiç |  |

### erectionQuality (`single`, required)
Cinsel fonksiyonla ilgili zorlanma yasiyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| sometimes | Ara sira |  |
| often | Sık |  |

### waistCircumferenceRisk (`single`, required)
Bel cevresi olcumu konusunda risk oldugünu dusunuyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| not_sure | Emin değilim |  |
| yes | Evet |  |

### snoring (`single`, required)
Yüksek sesle horlama veya uykuda nefes durması şüpheleri var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| occasionally | Ara sira |  |
| frequent | Sık |  |

### hairLossConcerns (`single`)
Saç dökülmesi ile ilgili belirgin bir kaygınız var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| mild | Hafif |  |
| high | Belirgin |  |

### maleFertilityPlan (`single`)
Önümüzdeki 12 ay içinde cocuk sahibi olma planiniz var mi?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| maybe | Belki |  |
| yes | Evet |  |

## `diet_reason` — Başvuru Nedeni

### dietReason (`multi`, required)
Diyetisyen desteği alma nedeniniz nedir?

| value | label | emoji |
|-------|-------|-------|
| weight_loss | Kilo verme |  |
| weight_gain | Kilo alma |  |
| healthy_eating | Sağlıklı beslenme |  |
| sport_performance | Spor performansı |  |
| medical_nutrition | Hastalığa yönelik beslenme tedavisi |  |
| pregnancy_lactation | Gebelik / Emzirme |  |
| child_teen | Çocuk / Ergen beslenmesi |  |
| other | Diğer |  |

### bodyAppearance (`emoji`, required)
Fiziksel görünümünüz konusunda kendinizi nasıl hissediyorsunuz?

| value | label | emoji |
|-------|-------|-------|
| very_low | Hiç memnun değilim | 😞 |
| low | Pek memnun değilim | 🙁 |
| medium | Kararsızım | 😐 |
| good | Memnunum | 🙂 |
| excellent | Çok memnunum | 😄 |

### primaryGoalReason (`single`, required)
Sağlıklı yaşam hedefinizin en önemli nedeni nedir?

| value | label | emoji |
|-------|-------|-------|
| healthier | Daha sağlıklı olmak |  |
| energy | Daha enerjik hissetmek |  |
| weight_loss | Kilo vermek |  |
| muscle | Kas yapmak |  |
| feel_better | Kendimi daha iyi hissetmek |  |
| appearance | Görünüşümden memnun olmak |  |
| doctor | Doktor önerisi |  |
| sport | Spor performansı |  |
| other | Diğer |  |

### weightChange (`single`, required)
Son 3 ayda kilonuzda belirgin değişim oldu mu?

| value | label | emoji |
|-------|-------|-------|
| lost | Kilo verdim |  |
| gained | Kilo aldım |  |
| stable | Stabil kaldı |  |
| unknown | Takip etmedim |  |

### dietGoal (`text`, required)
Hedefiniz nedir?

_No options (free text / time / etc.)_

## `diet_health` — Sağlık Durumu

### dietDiagnosed (`single`, required)
Doktor tarafından tanı konulmuş hastalığınız var mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietSurgeries (`text`)
Geçirdiğiniz ameliyatlar

_No options (free text / time / etc.)_

### dietMedications (`text`)
Düzenli kullandığınız ilaçlar

_No options (free text / time / etc.)_

### dietSupplements (`text`)
Kullandığınız vitamin, mineral veya bitkisel takviyeler

_No options (free text / time / etc.)_

### dietFoodAllergies (`single`, required)
Besin alerjiniz veya intoleransınız var mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietDigestiveSymptoms (`multi`)
Sindirim sistemi ile ilgili şikâyetleriniz var mı?

| value | label | emoji |
|-------|-------|-------|
| bloating | Şişkinlik |  |
| gas | Gaz |  |
| constipation | Kabızlık |  |
| diarrhea | İshal |  |
| reflux | Reflü |  |
| heartburn | Mide yanması |  |
| nausea | Bulantı |  |
| other | Diğer |  |

### dietFamilyHistory (`multi`)
Aile öyküsü — ailenizde aşağıdaki hastalıklardan bulunan var mı?

| value | label | emoji |
|-------|-------|-------|
| diabetes | Diyabet |  |
| hypertension | Hipertansiyon |  |
| heart | Kalp hastalığı |  |
| thyroid | Tiroid hastalığı |  |
| obesity | Obezite |  |
| cancer | Kanser |  |
| cholesterol | Kolesterol yüksekliği |  |
| other | Diğer |  |

## `diet_lifestyle` — Yaşam Tarzı

### dietSmoking (`single`, required)
Sigara kullanıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietAlcohol (`single`, required)
Alkol kullanıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietWaterIntake (`single`, required)
Su tüketiminiz

| value | label | emoji |
|-------|-------|-------|
| 1_2l | 1–2 L |  |
| 2_3l | 2–3 L |  |
| 3l_plus | 3 L ve üzeri |  |

### dietSleepHours (`text`, required)
Uyku süreniz (saat)

_No options (free text / time / etc.)_

### dietSleepQuality (`single`, required)
Uyku kaliteniz

| value | label | emoji |
|-------|-------|-------|
| good | İyi |  |
| fair | Orta |  |
| poor | Kötü |  |

### dietStressLevel (`single`, required)
Stres düzeyiniz

| value | label | emoji |
|-------|-------|-------|
| low | Düşük |  |
| moderate | Orta |  |
| high | Yüksek |  |

## `diet_activity` — Fiziksel Aktivite

### dietExercise (`single`, required)
Egzersiz yapıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietExerciseDays (`text`)
Haftada kaç gün egzersiz yapıyorsunuz?

_No options (free text / time / etc.)_

### dietExerciseDuration (`text`)
Egzersiz süreniz (dakika)

_No options (free text / time / etc.)_

## `diet_nutrition` — Beslenme Alışkanlıkları

### dietMealsPerDay (`single`, required)
Günde kaç öğün tüketirsiniz?

| value | label | emoji |
|-------|-------|-------|
| 2 | 2 |  |
| 3 | 3 |  |
| 4 | 4 |  |
| 5_plus | 5+ |  |

### dietSnacking (`single`, required)
Ara öğün yapıyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| yes | Evet |  |
| no | Hayır |  |

### dietBreakfast (`single`, required)
Kahvaltı yapar mısınız?

| value | label | emoji |
|-------|-------|-------|
| daily | Her gün |  |
| sometimes | Bazen |  |
| no | Hayır |  |

### dietBeverages (`multi`)
En çok tükettiğiniz içecekler

| value | label | emoji |
|-------|-------|-------|
| water | Su |  |
| tea | Çay |  |
| coffee | Kahve |  |
| soda | Asitli içecek |  |
| juice | Meyve suyu |  |
| energy | Enerji içeceği |  |
| other | Diğer |  |

### dietEatOut (`single`, required)
Haftada kaç kez dışarıdan yemek yersiniz?

| value | label | emoji |
|-------|-------|-------|
| none | Hiç |  |
| 1_2 | 1–2 |  |
| 3_5 | 3–5 |  |
| 5_plus | 5+ |  |

### dietSweetIntake (`single`, required)
Tatlı tüketiminiz

| value | label | emoji |
|-------|-------|-------|
| none | Hiç |  |
| 1_2_week | Haftada 1–2 |  |
| 3_plus_week | Haftada 3+ |  |

### dietNightEating (`single`, required)
Gece yeme alışkanlığınız var mı?

| value | label | emoji |
|-------|-------|-------|
| yes | Evet |  |
| no | Hayır |  |

### dietEmotionalEating (`single`, required)
Duygusal yeme yaşadığınızı düşünüyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| yes | Evet |  |
| no | Hayır |  |

### dietCravings (`text`)
Canınız en çok hangi besinleri çeker?

_No options (free text / time / etc.)_

## `diet_women` — Kadın Danışanlar

### dietMenstrual (`single`, required)
Adet düzeniniz

| value | label | emoji |
|-------|-------|-------|
| regular | Düzenli |  |
| irregular | Düzensiz |  |
| menopause | Menopoz |  |

### dietPregnancy (`single`, required)
Gebelik durumu

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietBreastfeeding (`single`, required)
Emziriyor musunuz?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietPcos (`single`, required)
Polikistik over sendromu (PKOS) tanınız var mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

## `diet_extra` — Ek Bilgiler

### dietPastDiet (`single`, required)
Geçmiş diyet deneyimi — daha önce diyet yaptınız mı?

| value | label | emoji |
|-------|-------|-------|
| no | Hayır |  |
| yes | Evet |  |

### dietMaxWeightLoss (`text`)
En fazla verdiğiniz kilo (kg)

_No options (free text / time / etc.)_

### dietWeightRegain (`single`)
Tekrar kilo aldınız mı?

| value | label | emoji |
|-------|-------|-------|
| yes | Evet |  |
| no | Hayır |  |

### dietDislikedFoods (`text`)
Sevmediğiniz besinler

_No options (free text / time / etc.)_

### dietAvoidFoods (`text`)
Tüketmek istemediğiniz besinler

_No options (free text / time / etc.)_

### dietWorkHours (`text`)
İş saatleriniz

_No options (free text / time / etc.)_

### dietBarriers (`text`)
Beslenmenizi zorlaştıran durumlar nelerdir?

_No options (free text / time / etc.)_

### dietAdditionalInfo (`text`)
Eklemek istediğiniz başka bir bilgi var mı?

_No options (free text / time / etc.)_

