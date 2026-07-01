export const HEALTH_SECTIONS = [
  {
    id: 'general',
    title: 'Genel Durum',
    subtitle: 'Ruh hali, enerji ve genel iyilik hali',
    icon: 'HeartPulse',
    audience: 'shared',
    questions: [
      {
        type: 'emoji',
        key: 'wellbeing',
        label: 'Son 2 haftada kendinizi genel olarak nasıl hissettiniz?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok kötü', emoji: '😞' },
          { value: 'low', label: 'Düşük', emoji: '🙁' },
          { value: 'medium', label: 'Orta', emoji: '😐' },
          { value: 'good', label: 'İyi', emoji: '🙂' },
          { value: 'excellent', label: 'Harika', emoji: '😄' }
        ]
      },
      {
        type: 'single',
        key: 'energy',
        label: 'Gün içinde enerji seviyeniz nasıl?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok düşük' },
          { value: 'low', label: 'Düşük' },
          { value: 'moderate', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'motivation',
        label: 'Sağlık hedeflerinize baslama motivasyonunuz ne düzeyde?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok düşük' },
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' },
          { value: 'very_high', label: 'Çok yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'concentration',
        label: 'Gündelik islerde odaklanma güçlüğü yasiyor musunuz?',
        required: true,
        options: [
          { value: 'never', label: 'Hiç' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Sık' },
          { value: 'always', label: 'Çok sık' }
        ]
      },
      {
        type: 'single',
        key: 'anxiety',
        label: 'Kaygı seviyenizi nasıl değerlendirirsiniz?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'mild', label: 'Hafif' },
          { value: 'moderate', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'socialSupport',
        label: 'Aile veya arkadas desteği hissediyor musunuz?',
        required: true,
        options: [
          { value: 'strong', label: 'Güçlü destek var' },
          { value: 'partial', label: 'Kısmen destek var' },
          { value: 'limited', label: 'Çok sınırlı destek var' },
          { value: 'none', label: 'Destek yok' }
        ]
      },
      {
        type: 'single',
        key: 'weightChange',
        label: 'Son 3 ayda kilonuzda belirgin değişim oldu mu?',
        required: true,
        options: [
          { value: 'lost', label: 'Kilo verdim' },
          { value: 'gained', label: 'Kilo aldim' },
          { value: 'stable', label: 'Stabil kaldi' },
          { value: 'unknown', label: 'Takip etmedim' }
        ],
        detail: {
          key: 'weightChangeDetail',
          when: ['lost', 'gained'],
          placeholder: 'Yaklasık kaç kg değişim oldu?'
        }
      },
      {
        type: 'single',
        key: 'painScale',
        label: 'Bugünku ağrı seviyeniz kaç/10?',
        required: true,
        options: [
          { value: '0-1', label: '0-1 (yok denecek kadar az)' },
          { value: '2-3', label: '2-3 (hafif)' },
          { value: '4-6', label: '4-6 (orta)' },
          { value: '7-8', label: '7-8 (yüksek)' },
          { value: '9-10', label: '9-10 (çok şiddetli)' }
        ]
      },
      {
        type: 'emoji',
        key: 'moodCheckin',
        label: 'Bu hafta ruh halinizi hangi emoji en iyi anlatir?',
        required: true,
        options: [
          { value: 'very_sad', label: 'Çok uzgün', emoji: '😢' },
          { value: 'stressed', label: 'Gergin', emoji: '😣' },
          { value: 'neutral', label: 'Nötr', emoji: '😐' },
          { value: 'calm', label: 'Sakin', emoji: '🙂' },
          { value: 'happy', label: 'Mutlu', emoji: '😄' }
        ]
      },
      {
        type: 'single',
        key: 'selfConfidence',
        label: 'Bedeninizle ilgili özgüven düzeyiniz nasıl?',
        required: false,
        options: [
          { value: 'very_low', label: 'Çok düşük' },
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'dailyStressImpact',
        label: 'Stres günluk kararlarinizi ne kadar etkiliyor?',
        required: true,
        options: [
          { value: 'none', label: 'Etkilemiyor' },
          { value: 'low', label: 'Az etkiliyor' },
          { value: 'moderate', label: 'Orta düzeyde etkiliyor' },
          { value: 'high', label: 'Çok etkiliyor' }
        ]
      },
      {
        type: 'single',
        key: 'readinessToChange',
        label: 'Hayat tarzı degisıkliklerine hazirlik düzeyiniz nedir?',
        required: true,
        options: [
          { value: 'not_ready', label: 'Henüz hazir değilim' },
          { value: 'thinking', label: 'Düşünme asamasindayim' },
          { value: 'ready', label: 'Hazirim' },
          { value: 'started', label: 'Basladim' }
        ]
      }
    ]
  },
  {
    id: 'medical',
    title: 'Tıbbi Geçmiş',
    subtitle: 'Hastalıklar, ilaçlar ve tıbbi takip',
    icon: 'Stethoscope',
    audience: 'shared',
    questions: [
      {
        type: 'multi',
        key: 'chronicConditions',
        label: 'Tanı almis kronik rahatsızlıklarınız var mi?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'hypertension', label: 'Yüksek tansiyon' },
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'thyroid', label: 'Tiroid hastalığı' },
          { value: 'pcos', label: 'PKOS' },
          { value: 'asthma', label: 'Astım' },
          { value: 'other', label: 'Diğer' }
        ],
        detail: {
          key: 'chronicConditionsDetail',
          when: ['other'],
          placeholder: 'Diğer kronik durumlari yaziniz'
        }
      },
      {
        type: 'single',
        key: 'medications',
        label: 'Düzenli kullandiginiz ilaç var mi?',
        required: true,
        options: [
          { value: 'none', label: 'Hayır' },
          { value: 'regular', label: 'Evet, düzenli' },
          { value: 'occasional', label: 'Ara sira' }
        ],
        detail: {
          key: 'medicationsDetail',
          when: ['regular', 'occasional'],
          placeholder: 'İlaç adini ve kullanim sıkligini yaziniz'
        }
      },
      {
        type: 'multi',
        key: 'familyHistory',
        label: 'Ailenizde aşağıdaki rahatsızlıklardan hangileri var?',
        required: true,
        options: [
          { value: 'none', label: 'Bilinmiyor / Yok' },
          { value: 'diabetes', label: 'Diyabet' },
          { value: 'obesity', label: 'Obezite' },
          { value: 'heartDisease', label: 'Kalp hastalığı' },
          { value: 'stroke', label: 'İnme' },
          { value: 'cancer', label: 'Kanser' }
        ]
      },
      {
        type: 'single',
        key: 'injuries',
        label: 'Son 2 yılda hareketi etkileyen sakatlık yasadiniz mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes_recovered', label: 'Evet, iyileştim' },
          { value: 'yes_ongoing', label: 'Evet, halen devam ediyor' }
        ],
        detail: {
          key: 'injuriesDetail',
          when: ['yes_recovered', 'yes_ongoing'],
          placeholder: 'Sakatligin bölgesi ve tarihi'
        }
      },
      {
        type: 'single',
        key: 'surgeries',
        label: 'Gecirdiginiz ameliyat var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' }
        ],
        detail: {
          key: 'surgeriesDetail',
          when: ['yes'],
          placeholder: 'Ameliyat turu ve yılini yaziniz'
        }
      },
      {
        type: 'single',
        key: 'hospitalVisits',
        label: 'Son 12 ayda hastane aciline basvurdunuz mu?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'once', label: '1 kez' },
          { value: 'multiple', label: 'Birden fazla' }
        ]
      },
      {
        type: 'single',
        key: 'lastBloodWork',
        label: 'Son kapsamli kan tahlilinizi ne zaman yaptırdınız?',
        required: true,
        options: [
          { value: 'last_3_months', label: 'Son 3 ay içinde' },
          { value: '3_12_months', label: '3-12 ay once' },
          { value: 'over_year', label: '1 yıldan uzun' },
          { value: 'never', label: 'Hiç yaptirmadim' }
        ]
      },
      {
        type: 'multi',
        key: 'supplements',
        label: 'Düzenli kullandiginiz takviyeler hangileri?',
        required: false,
        options: [
          { value: 'none', label: 'Kullanmiyorum' },
          { value: 'vitaminD', label: 'D vitamini' },
          { value: 'omega3', label: 'Omega-3' },
          { value: 'magnesium', label: 'Magnezyum' },
          { value: 'proteinPowder', label: 'Protein tozu' },
          { value: 'probiotic', label: 'Probiyotik' },
          { value: 'other', label: 'Diğer' }
        ],
        detail: {
          key: 'supplementsDetail',
          when: ['other'],
          placeholder: 'Diğer takviyeleri yaziniz'
        }
      },
      {
        type: 'single',
        key: 'mentalHealthDiagnosis',
        label: 'Bir ruh sagligi tanı veya tedavi geçmişiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'ongoing', label: 'Şu anda devam ediyor' }
        ]
      },
      {
        type: 'single',
        key: 'doctorClearance',
        label: 'Egzersiz veya kilo yonetimi programi icin doktor onayi aldiniz mi?',
        required: true,
        options: [
          { value: 'yes', label: 'Evet' },
          { value: 'no_need', label: 'Gerek gormedim' },
          { value: 'not_yet', label: 'Henüz almadim' }
        ]
      },
      {
        type: 'single',
        key: 'bloodPressureIssues',
        label: 'Tansiyon dalgalanmasi sorunu yasiyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'yes', label: 'Evet, sık' }
        ]
      },
      {
        type: 'single',
        key: 'digestiveDisorders',
        label: 'Tanı almis sindirim sistemi rahatsizliginiz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'ibs', label: 'IBS' },
          { value: 'reflux', label: 'Reflu' },
          { value: 'gastritis', label: 'Gastrit' },
          { value: 'other', label: 'Diğer' }
        ]
      },
      {
        type: 'single',
        key: 'thyroidStatus',
        label: 'Tiroid degerlerinizle ilgili bilinen bir durum var mi?',
        required: false,
        options: [
          { value: 'normal', label: 'Bilinen sorun yok' },
          { value: 'hypo', label: 'Hipotiroidi' },
          { value: 'hyper', label: 'Hipertiroidi' },
          { value: 'unknown', label: 'Bilmiyorum' }
        ]
      },
      {
        type: 'text',
        key: 'currentComplaints',
        label: 'Şu an sizi en çok zorlayan sağlık sıkayetini kisaça yaziniz',
        required: false,
        hint: 'Örnek: bel ağrısi, nefes darligi, surekli yorgünluk'
      }
    ]
  },
  {
    id: 'physical',
    title: 'Fiziksel Kapasite',
    subtitle: 'Hareket geçmişi ve antrenman hazırlığı',
    icon: 'Dumbbell',
    audience: 'coach',
    questions: [
      {
        type: 'single',
        key: 'activityFrequency',
        label: 'Haftada kaç gün düzenli fiziksel aktivite yapiyorsunuz?',
        required: true,
        options: [
          { value: '0', label: '0 gün' },
          { value: '1_2', label: '1-2 gün' },
          { value: '3_4', label: '3-4 gün' },
          { value: '5_plus', label: '5+ gün' }
        ]
      },
      {
        type: 'single',
        key: 'trainingHistoryYears',
        label: 'Toplam düzenli antrenman geçmişiniz ne kadar?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'under_6m', label: '6 aydan az' },
          { value: '6m_2y', label: '6 ay - 2 yıl' },
          { value: '2y_plus', label: '2 yıl+' }
        ]
      },
      {
        type: 'multi',
        key: 'currentActivityTypes',
        label: 'Şu anda yaptiginiz aktiviteler hangileri?',
        required: true,
        options: [
          { value: 'walking', label: 'Yürüyüş' },
          { value: 'running', label: 'Koşu' },
          { value: 'strength', label: 'Kuvvet antrenmani' },
          { value: 'pilates', label: 'Pilates/Yoga' },
          { value: 'cycling', label: 'Bisıklet' },
          { value: 'none', label: 'Düzenli aktivitem yok' }
        ]
      },
      {
        type: 'single',
        key: 'movementQuality',
        label: 'Temel hareketlerde koordinasyonunuzu nasıl değerlendirirsiniz?',
        required: false,
        options: [
          { value: 'weak', label: 'Zayif' },
          { value: 'fair', label: 'Gelişmeye açık' },
          { value: 'good', label: 'İyi' },
          { value: 'very_good', label: 'Çok iyi' }
        ]
      },
      {
        type: 'single',
        key: 'flexibilityLevel',
        label: 'Esneklik seviyeniz nasıl?',
        required: true,
        options: [
          { value: 'very_low', label: 'Çok düşük' },
          { value: 'low', label: 'Düşük' },
          { value: 'medium', label: 'Orta' },
          { value: 'high', label: 'Yüksek' }
        ]
      },
      {
        type: 'single',
        key: 'cardioCapacity',
        label: '10-15 dk tempolu yürüyüşte nefes durumunuz nasıl?',
        required: true,
        options: [
          { value: 'very_hard', label: 'Çok zorlaniyorum' },
          { value: 'hard', label: 'Zorlaniyorum' },
          { value: 'manageable', label: 'İdare ediyorum' },
          { value: 'easy', label: 'Rahatim' }
        ]
      },
      {
        type: 'multi',
        key: 'sportsHistory',
        label: 'Geçmişte düzenli yaptiginiz sporlar hangileri?',
        required: false,
        options: [
          { value: 'football', label: 'Futbol' },
          { value: 'basketball', label: 'Basketbol' },
          { value: 'swimming', label: 'Yüzme' },
          { value: 'martialArts', label: 'Dövüş sporlari' },
          { value: 'athletics', label: 'Atletizm' },
          { value: 'none', label: 'Yok' }
        ]
      },
      {
        type: 'multi',
        key: 'equipmentAccess',
        label: 'Antrenman icin hangi ekipmanlara erisiminiz var?',
        required: true,
        options: [
          { value: 'bodyweight', label: 'Sadece vücut agirligi' },
          { value: 'dumbbells', label: 'Dambil' },
          { value: 'bands', label: 'Direnc bandi' },
          { value: 'cardioMachine', label: 'Kondisyon cihazi' },
          { value: 'gym', label: 'Tam donanimli spor salonu' }
        ]
      },
      {
        type: 'multi',
        key: 'preferredTrainingDays',
        label: 'Antrenman icin uygün günleriniz hangileri?',
        required: true,
        options: [
          { value: 'monday', label: 'Pazartesi' },
          { value: 'tuesday', label: 'Salı' },
          { value: 'wednesday', label: 'Çarşamba' },
          { value: 'thursday', label: 'Perşembe' },
          { value: 'friday', label: 'Cuma' },
          { value: 'saturday', label: 'Cumartesi' },
          { value: 'sunday', label: 'Pazar' }
        ]
      },
      {
        type: 'single',
        key: 'sessionDurationGoal',
        label: 'Tek bir antrenmana ayirabileceginiz sure ne kadar?',
        required: true,
        options: [
          { value: '15_25', label: '15-25 dk' },
          { value: '30_40', label: '30-40 dk' },
          { value: '45_60', label: '45-60 dk' },
          { value: '60_plus', label: '60+ dk' }
        ]
      },
      {
        type: 'single',
        key: 'trainingLocation',
        label: 'Nerede antrenman yapmayi tercih edersiniz?',
        required: true,
        options: [
          { value: 'home', label: 'Evde' },
          { value: 'gym', label: 'Spor salonunda' },
          { value: 'outdoor', label: 'Açık alanda' },
          { value: 'mixed', label: 'Karışık' }
        ]
      },
      {
        type: 'single',
        key: 'previousCoachExperience',
        label: 'Daha once bir antrenörle calistiniz mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'online', label: 'Evet, online' },
          { value: 'face_to_face', label: 'Evet, yüz yüze' }
        ]
      },
      {
        type: 'single',
        key: 'exerciseContraindications',
        label: 'Yapmanız önerilen hareket/egzersiz var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'yes', label: 'Var' }
        ],
        detail: {
          key: 'exerciseContraindicationsDetail',
          when: ['yes'],
          placeholder: 'Kaçinmaniz gereken hareketleri yaziniz'
        }
      },
      {
        type: 'multi',
        key: 'painAreas',
        label: 'Düzenli ağrı yaşadığınız bölgeler hangileri?',
        required: false,
        hint: 'Yoksa boş bırakın.',
        options: [
          { value: 'lowback', label: 'Bel' },
          { value: 'neck', label: 'Boyun' },
          { value: 'knee', label: 'Diz' },
          { value: 'shoulder', label: 'Omuz' },
          { value: 'hip', label: 'Kalça' },
          { value: 'ankle', label: 'Ayak bileği' },
          { value: 'wrist', label: 'El bileği' }
        ]
      },
      {
        type: 'text',
        key: 'performanceGoal',
        label: 'Önümüzdeki 3 ay icin en öncelikli fiziksel hedefiniz nedir?',
        required: true,
        hint: 'Örnek: 5 km kosabilmek, duzgün squat ogrenmek, 6 kg vermek'
      }
    ]
  },
  {
    id: 'lifestyle',
    title: 'Yaşam Tarzi',
    subtitle: 'Günluk alışkanlıklar ve davranislar',
    icon: 'Activity',
    audience: 'coach',
    questions: [
      {
        type: 'single',
        key: 'sittingHours',
        label: 'Günluk ortalama kaç saat oturuyorsunuz?',
        required: true,
        options: [
          { value: 'under_4', label: '4 saatten az' },
          { value: '4_6', label: '4-6 saat' },
          { value: '7_9', label: '7-9 saat' },
          { value: '10_plus', label: '10 saat+' }
        ]
      },
      {
        type: 'single',
        key: 'smoking',
        label: 'Sigara kullanıyor musunuz?',
        required: true,
        options: [
          { value: 'never', label: 'Hiç kullanmadim' },
          { value: 'former', label: 'Biraktim' },
          { value: 'occasional', label: 'Ara sira' },
          { value: 'daily', label: 'Her gün' }
        ]
      },
      {
        type: 'single',
        key: 'alcohol',
        label: 'Alkol tüketim sıkliginiz nasıl?',
        required: true,
        options: [
          { value: 'none', label: 'Hiç' },
          { value: 'monthly', label: 'Ayda 1-2 kez' },
          { value: 'weekly', label: 'Haftada 1-2 kez' },
          { value: 'frequent', label: 'Haftada 3+ kez' }
        ]
      },
      {
        type: 'single',
        key: 'teaCoffee',
        label: 'Günluk cay/kahve tüketiminiz ne kadar?',
        required: true,
        options: [
          { value: '0_1', label: '0-1 fincan' },
          { value: '2_3', label: '2-3 fincan' },
          { value: '4_5', label: '4-5 fincan' },
          { value: '6_plus', label: '6+ fincan' }
        ]
      },
      {
        type: 'single',
        key: 'travelFrequency',
        label: 'Is veya ozel nedenlerle şehir dışı seyahat sıkliginiz?',
        required: false,
        options: [
          { value: 'rare', label: 'Çok nadir' },
          { value: 'monthly', label: 'Ayda 1 civari' },
          { value: 'biweekly', label: 'Ayda 2-3' },
          { value: 'weekly', label: 'Haftalik' }
        ]
      },
      {
        type: 'single',
        key: 'substanceUse',
        label: 'Sigara dışında madde kullaniminiz var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'yes', label: 'Evet' }
        ]
      },
      {
        type: 'single',
        key: 'shiftWork',
        label: 'Vardiyali veya duzensiz saatlerde calisiyor musunuz?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Dönemsel' },
          { value: 'yes', label: 'Evet, düzenli' }
        ]
      },
      {
        type: 'single',
        key: 'dailySteps',
        label: 'Günluk ortalama adim sayiniz nedir?',
        required: false,
        options: [
          { value: 'under_3000', label: '3000 altı' },
          { value: '3000_6000', label: '3000-6000' },
          { value: '6000_9000', label: '6000-9000' },
          { value: '9000_plus', label: '9000+' }
        ]
      },
      {
        type: 'single',
        key: 'screenTime',
        label: 'Günluk ekran başında geçirdiğiniz toplam sure ne kadar?',
        required: false,
        options: [
          { value: 'under_3', label: '3 saatten az' },
          { value: '3_5', label: '3-5 saat' },
          { value: '6_8', label: '6-8 saat' },
          { value: '9_plus', label: '9 saat+' }
        ]
      },
      {
        type: 'multi',
        key: 'exercisePreferences',
        label: 'Hangi egzersiz turleri size daha keyifli geliyor?',
        required: true,
        options: [
          { value: 'walking', label: 'Yürüyüş' },
          { value: 'strength', label: 'Kuvvet' },
          { value: 'group', label: 'Grup dersleri' },
          { value: 'mindBody', label: 'Yoga/Pilates' },
          { value: 'shortHome', label: 'Kisa ev antrenmani' }
        ]
      },
      {
        type: 'multi',
        key: 'exerciseBarriers',
        label: 'Düzenli egzersiz yapmanizi en çok zorlayan etkenler neler?',
        required: true,
        options: [
          { value: 'time', label: 'Zaman yetersizligi' },
          { value: 'motivation', label: 'Motivasyon düşüklugu' },
          { value: 'pain', label: 'Ağrı/sakatlık korkusu' },
          { value: 'knowledge', label: 'Nasıl yapacagimi bilmiyorum' },
          { value: 'environment', label: 'Uygün ortam yok' }
        ]
      },
      {
        type: 'single',
        key: 'commuteType',
        label: 'Günluk ulaşım sekli en çok hangisi?',
        required: false,
        options: [
          { value: 'car', label: 'Araç' },
          { value: 'public', label: 'Toplu taşıma' },
          { value: 'walk', label: 'Yürüyerek' },
          { value: 'mixed', label: 'Karışık' }
        ]
      }
    ]
  },
  {
    id: 'routine',
    title: 'Günluk Rutin',
    subtitle: 'Saatler, yemek duzeni ve planlama',
    icon: 'Clock3',
    audience: 'dietitian',
    questions: [
      {
        type: 'time',
        key: 'wakeTime',
        label: 'Genellikle saat kaçta uyaniyorsunuz?',
        required: true
      },
      {
        type: 'time',
        key: 'sleepTime',
        label: 'Genellikle saat kaçta uyuyorsunuz?',
        required: true
      },
      {
        type: 'time',
        key: 'breakfastTime',
        label: 'Kahvaltı saatiniz genellikle ne zaman?',
        required: false
      },
      {
        type: 'time',
        key: 'lunchTime',
        label: 'Öğle yemegi saatiniz genellikle ne zaman?',
        required: false
      },
      {
        type: 'time',
        key: 'dinnerTime',
        label: 'Akşam yemegi saatiniz genellikle ne zaman?',
        required: false
      },
      {
        type: 'single',
        key: 'workFromHome',
        label: 'Çalışma duzeniniz nasıl?',
        required: true,
        options: [
          { value: 'office', label: 'Ofisten calisiyorum' },
          { value: 'hybrid', label: 'Hibrit' },
          { value: 'home', label: 'Evden calisiyorum' },
          { value: 'not_working', label: 'Calismiyorum' }
        ]
      },
      {
        type: 'single',
        key: 'cookingFrequency',
        label: 'Haftada kaç gün evde yemek pişirirsiniz?',
        required: true,
        options: [
          { value: '0_1', label: '0-1 gün' },
          { value: '2_3', label: '2-3 gün' },
          { value: '4_5', label: '4-5 gün' },
          { value: '6_7', label: '6-7 gün' }
        ]
      },
      {
        type: 'single',
        key: 'mealPrepDays',
        label: 'Yemek on hazırlığı (meal prep) yapiyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'weekly', label: 'Haftalik düzenli' }
        ]
      },
      {
        type: 'single',
        key: 'eatOutFrequency',
        label: 'Haftada kaç ogün disaridan yersiniz?',
        required: true,
        options: [
          { value: '0_1', label: '0-1 ogün' },
          { value: '2_4', label: '2-4 ogün' },
          { value: '5_7', label: '5-7 ogün' },
          { value: '8_plus', label: '8+ ogün' }
        ]
      },
      {
        type: 'multi',
        key: 'snackTimes',
        label: 'Ara ogün ihtiyaciniz daha çok hangi saatlerde oluyor?',
        required: false,
        options: [
          { value: 'mid_morning', label: 'Sabah ara' },
          { value: 'afternoon', label: 'İkindi' },
          { value: 'late_evening', label: 'Akşam geç' },
          { value: 'night', label: 'Gece' }
        ]
      }
    ]
  },
  {
    id: 'recovery',
    title: 'Uyku ve Toparlanma',
    subtitle: 'Stres, uyku kalitesi ve toparlanma alışkanlıklari',
    icon: 'MoonStar',
    audience: 'dietitian',
    questions: [
      {
        type: 'single',
        key: 'sleepHours',
        label: 'Ortalama kaç saat uyuyorsunuz?',
        required: true,
        options: [
          { value: 'under_5', label: '5 saatten az' },
          { value: '5_6', label: '5-6 saat' },
          { value: '7_8', label: '7-8 saat' },
          { value: '9_plus', label: '9 saat+' }
        ]
      },
      {
        type: 'single',
        key: 'sleepQuality',
        label: 'Uyku kalitenizi nasıl değerlendirirsiniz?',
        required: true,
        options: [
          { value: 'poor', label: 'Kotu' },
          { value: 'fair', label: 'Orta' },
          { value: 'good', label: 'İyi' },
          { value: 'excellent', label: 'Çok iyi' }
        ]
      },
      {
        type: 'single',
        key: 'stressLevel',
        label: 'Genel stres düzeyiniz nasıl?',
        required: true,
        options: [
          { value: 'low', label: 'Düşük' },
          { value: 'moderate', label: 'Orta' },
          { value: 'high', label: 'Yüksek' },
          { value: 'very_high', label: 'Çok yüksek' }
        ]
      },
      {
        type: 'emoji',
        key: 'mood',
        label: 'Son bir haftadaki baskin ruh haliniz hangisi?',
        required: true,
        options: [
          { value: 'down', label: 'Düşük', emoji: '😔' },
          { value: 'tense', label: 'Gergin', emoji: '😣' },
          { value: 'neutral', label: 'Dengeli', emoji: '😐' },
          { value: 'positive', label: 'Pozitif', emoji: '🙂' },
          { value: 'energetic', label: 'Canli', emoji: '😄' }
        ]
      },
      {
        type: 'single',
        key: 'sleepInterruptions',
        label: 'Geceleri kaç kez uyaniyorsunuz?',
        required: false,
        options: [
          { value: 'none', label: 'Hiç' },
          { value: 'once', label: '1 kez' },
          { value: 'twice', label: '2 kez' },
          { value: 'three_plus', label: '3+ kez' }
        ]
      },
      {
        type: 'multi',
        key: 'stressTriggers',
        label: 'Stresinizi en çok tetikleyen durumlar neler?',
        required: false,
        options: [
          { value: 'work', label: 'Is yogünlugu' },
          { value: 'family', label: 'Aile sorumluluklari' },
          { value: 'finance', label: 'Maddi konular' },
          { value: 'health', label: 'Sağlık endisesi' },
          { value: 'sleep', label: 'Uyku duzensizligi' }
        ]
      },
      {
        type: 'multi',
        key: 'copingMethods',
        label: 'Stresle basa cikmak icin neler yapiyorsunuz?',
        required: false,
        options: [
          { value: 'walking', label: 'Yürüyüş' },
          { value: 'breathing', label: 'Nefes egzersizi/meditasyon' },
          { value: 'music', label: 'Muzik/okuma' },
          { value: 'social', label: 'Sosyallesme' },
          { value: 'none', label: 'Belirgin bir yontemim yok' }
        ]
      },
      {
        type: 'single',
        key: 'recoveryDays',
        label: 'Haftada aktif dinlenme/rahatlama icin ayirdiginiz gün sayisi?',
        required: false,
        options: [
          { value: '0', label: '0 gün' },
          { value: '1', label: '1 gün' },
          { value: '2_3', label: '2-3 gün' },
          { value: '4_plus', label: '4+ gün' }
        ]
      },
      {
        type: 'single',
        key: 'morningFatigue',
        label: 'Sabah kalktiginda yorgün hissetme durumu?',
        required: false,
        options: [
          { value: 'never', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Sık' },
          { value: 'always', label: 'Hemen her gün' }
        ]
      },
      {
        type: 'single',
        key: 'relaxationPractice',
        label: 'Uyumadan once sakinlesme rutininiz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'yes', label: 'Evet, düzenli' }
        ]
      }
    ]
  },
  {
    id: 'nutrition',
    title: 'Beslenme Profili',
    subtitle: 'Yeme alışkanlıklari, tercihler ve zorluklar',
    icon: 'Apple',
    audience: 'dietitian',
    questions: [
      {
        type: 'single',
        key: 'mealsPerDay',
        label: 'Günluk kaç ana ogün tuketirsiniz?',
        required: true,
        options: [
          { value: '1', label: '1 ogün' },
          { value: '2', label: '2 ogün' },
          { value: '3', label: '3 ogün' },
          { value: '4_plus', label: '4+ ogün' }
        ]
      },
      {
        type: 'multi',
        key: 'eatingHabits',
        label: 'Yeme davranislarinizi en iyi tanımlayanlar hangileri?',
        required: true,
        options: [
          { value: 'fast_eating', label: 'Hizli yerim' },
          { value: 'late_eating', label: 'Gec saatlerde yerim' },
          { value: 'skip_meals', label: 'Ogün atlarim' },
          { value: 'emotional', label: 'Duygusal yeme olur' },
          { value: 'regular', label: 'Düzenli ogün yerim' }
        ]
      },
      {
        type: 'single',
        key: 'waterIntake',
        label: 'Günluk su tüketiminiz ne kadar?',
        required: true,
        options: [
          { value: 'under_1', label: '1 litreden az' },
          { value: '1_1_5', label: '1-1.5 litre' },
          { value: '1_5_2_5', label: '1.5-2.5 litre' },
          { value: '2_5_plus', label: '2.5 litre+' }
        ]
      },
      {
        type: 'multi',
        key: 'foodAllergies',
        label: 'Besin alerjisi/intoleransi durumunuz var mi?',
        required: true,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'lactose', label: 'Laktoz intoleransi' },
          { value: 'gluten', label: 'Gluten hassasiyeti' },
          { value: 'nuts', label: 'Kuruyemis alerjisi' },
          { value: 'seafood', label: 'Deniz urunleri alerjisi' },
          { value: 'other', label: 'Diğer' }
        ],
        detail: {
          key: 'foodAllergiesDetail',
          when: ['other'],
          placeholder: 'Diğer alerji/intoleranslari yaziniz'
        }
      },
      {
        type: 'multi',
        key: 'proteinSources',
        label: 'Protein ihtiyacinizi en çok hangi kaynaklardan karsilarsiniz?',
        required: true,
        options: [
          { value: 'eggs', label: 'Yumurta' },
          { value: 'chiçken', label: 'Tavuk/Hindi' },
          { value: 'redMeat', label: 'Kirmizi et' },
          { value: 'fish', label: 'Balik' },
          { value: 'legumes', label: 'Baklagil' },
          { value: 'dairy', label: 'Sut urunleri' }
        ]
      },
      {
        type: 'multi',
        key: 'carbSources',
        label: 'Karbonhidrat kaynagi olarak en çok neleri tuketirsiniz?',
        required: true,
        options: [
          { value: 'bread', label: 'Ekmek' },
          { value: 'rice', label: 'Pirinç/Bulgur' },
          { value: 'pasta', label: 'Makarna' },
          { value: 'potato', label: 'Patates' },
          { value: 'fruit', label: 'Meyve' },
          { value: 'pastry', label: 'Hamur isi' }
        ]
      },
      {
        type: 'multi',
        key: 'fatSources',
        label: 'Yag tüketiminde agirlikla hangi kaynaklari kullanıyorsunuz?',
        required: false,
        options: [
          { value: 'oliveOil', label: 'Zeytinyagi' },
          { value: 'butter', label: 'Tereyagi' },
          { value: 'seedOils', label: 'Aycicek vb. yaglar' },
          { value: 'nuts', label: 'Kuruyemis/avokado' },
          { value: 'friedFoods', label: 'Kizartma urunleri' }
        ]
      },
      {
        type: 'single',
        key: 'portionAwareness',
        label: 'Porsiyon kontrolu konusunda kendinizi nasıl goruyorsunuz?',
        required: true,
        options: [
          { value: 'struggle', label: 'Çok zorlaniyorum' },
          { value: 'sometimes', label: 'Bazen zorlaniyorum' },
          { value: 'good', label: 'Genelde iyi' },
          { value: 'very_good', label: 'Çok iyi yonetiyorum' }
        ]
      },
      {
        type: 'single',
        key: 'hungerLevel',
        label: 'Gün içinde aclik hissiniz nasıl seyrediyor?',
        required: false,
        options: [
          { value: 'low', label: 'Genelde az açıkiyorum' },
          { value: 'balanced', label: 'Dengeli' },
          { value: 'high', label: 'Sık açıkiyorum' },
          { value: 'very_high', label: 'Çok cabuk açıkiyorum' }
        ]
      },
      {
        type: 'single',
        key: 'cravings',
        label: 'Can cekmeleri en çok hangi donemde oluyor?',
        required: false,
        options: [
          { value: 'none', label: 'Belirgin degil' },
          { value: 'afternoon', label: 'Öğle sonrasi' },
          { value: 'evening', label: 'Akşam' },
          { value: 'night', label: 'Gece' }
        ]
      },
      {
        type: 'single',
        key: 'lateNightEating',
        label: 'Gece 22:00 sonrasi yeme aliskanliginiz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'rarely', label: 'Nadiren' },
          { value: 'often', label: 'Sık' }
        ]
      },
      {
        type: 'single',
        key: 'fiberIntake',
        label: 'Lifli besin (sebze, tam tahil, baklagil) tüketiminiz nasıl?',
        required: true,
        options: [
          { value: 'low', label: 'Düşük' },
          { value: 'moderate', label: 'Orta' },
          { value: 'good', label: 'İyi' }
        ]
      },
      {
        type: 'single',
        key: 'sugarIntake',
        label: 'Eklenmis şekerli urun tüketiminiz ne düzeyde?',
        required: true,
        options: [
          { value: 'rare', label: 'Çok nadir' },
          { value: 'weekly', label: 'Haftada birkaç kez' },
          { value: 'daily', label: 'Her gün' }
        ]
      },
      {
        type: 'single',
        key: 'saltUse',
        label: 'Yemeklere ekstra tuz ekleme aliskanliginiz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'yes', label: 'Evet' }
        ]
      },
      {
        type: 'text',
        key: 'dietHistory',
        label: 'Daha once denediginiz diyetleri ve sonucunu kisaça yaziniz',
        required: false,
        hint: 'Örnek: keto, aralikli oruc, kalori sayimi'
      },
      {
        type: 'single',
        key: 'budgetForFood',
        label: 'Sağlıkli beslenme icin aylik butcenizi nasıl değerlendirirsiniz?',
        required: false,
        options: [
          { value: 'limited', label: 'Sinirli' },
          { value: 'moderate', label: 'Orta' },
          { value: 'comfortable', label: 'Rahat' }
        ]
      },
      {
        type: 'single',
        key: 'breakfastContent',
        label: 'Kahvaltınizda protein kaynagi olmasi ne kadar sıklikta olur?',
        required: false,
        options: [
          { value: 'rare', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Cogünlukla' },
          { value: 'always', label: 'Her zaman' }
        ]
      },
      {
        type: 'single',
        key: 'vegetableFruitIntake',
        label: 'Günluk sebze-meyve porsiyonunuz ortalama kaç?',
        required: true,
        options: [
          { value: '0_1', label: '0-1 porsiyon' },
          { value: '2_3', label: '2-3 porsiyon' },
          { value: '4_5', label: '4-5 porsiyon' },
          { value: '6_plus', label: '6+ porsiyon' }
        ]
      },
      {
        type: 'single',
        key: 'digestiveComfort',
        label: 'Yemek sonrasi sislik/hazimsizlik yaşama durumunuz?',
        required: false,
        options: [
          { value: 'never', label: 'Nadiren' },
          { value: 'sometimes', label: 'Bazen' },
          { value: 'often', label: 'Sık' }
        ]
      }
    ]
  },
  {
    id: 'women',
    title: 'Kadin Sagligi',
    subtitle: 'Hormonel dongu ve kadin sagligi ozel sorulari',
    icon: 'Venus',
    audience: 'shared',
    genderOnly: 'female',
    questions: [
      {
        type: 'single',
        key: 'pregnancy',
        label: 'Şu an hamilelik durumu var mi?',
        required: true,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'yes', label: 'Evet' },
          { value: 'planning', label: 'Planliyorum' }
        ]
      },
      {
        type: 'single',
        key: 'menstrualRegular',
        label: 'Adet dongünuz genellikle düzenli mi?',
        required: true,
        options: [
          { value: 'regular', label: 'Düzenli' },
          { value: 'irregular', label: 'Duzensiz' },
          { value: 'absent', label: 'Uzun suredir olmuyor' }
        ]
      },
      {
        type: 'multi',
        key: 'pmsSymptoms',
        label: 'Adet oncesi donemde hangi belirtileri sık yasiyorsunuz?',
        required: false,
        options: [
          { value: 'none', label: 'Belirgin yok' },
          { value: 'bloating', label: 'Sislik' },
          { value: 'cravings', label: 'Yeme ataklari' },
          { value: 'mood_swings', label: 'Ruh hali değişimi' },
          { value: 'fatigue', label: 'Yorgünluk' },
          { value: 'headache', label: 'Bas ağrısi' }
        ]
      },
      {
        type: 'single',
        key: 'contraceptionMethod',
        label: 'Dogum kontrol yontemi kullanıyor musunuz?',
        required: false,
        options: [
          { value: 'none', label: 'Kullanmiyorum' },
          { value: 'barrier', label: 'Bariyer yontemleri' },
          { value: 'hormonal', label: 'Hormonal yontem' },
          { value: 'iud', label: 'Spiral (Ria)' },
          { value: 'other', label: 'Diğer' }
        ]
      },
      {
        type: 'single',
        key: 'menopauseStatus',
        label: 'Menopoz durumunuz nedir?',
        required: false,
        options: [
          { value: 'not_applicable', label: 'Uygün degil' },
          { value: 'premenopause', label: 'Premenopoz' },
          { value: 'perimenopause', label: 'Perimenopoz' },
          { value: 'postmenopause', label: 'Postmenopoz' }
        ]
      },
      {
        type: 'single',
        key: 'ironDeficiencyHistory',
        label: 'Demir eksıkligi veya anemi geçmişiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Yok' },
          { value: 'past', label: 'Geçmişte vardi' },
          { value: 'ongoing', label: 'Şu an devam ediyor' }
        ]
      },
      {
        type: 'single',
        key: 'cyclePain',
        label: 'Adet doneminde ağrılariniz ne düzeyde olur?',
        required: false,
        options: [
          { value: 'none', label: 'Yok' },
          { value: 'mild', label: 'Hafif' },
          { value: 'moderate', label: 'Orta' },
          { value: 'severe', label: 'Siddetli' }
        ]
      },
      {
        type: 'single',
        key: 'fertilityPlan',
        label: 'Önümüzdeki 12 ay içinde gebelik plani var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'maybe', label: 'Belki' },
          { value: 'yes', label: 'Evet' }
        ]
      }
    ]
  },
  {
    id: 'men',
    title: 'Erkek Sagligi',
    subtitle: 'Erkek sagligina ozel tarama ve belirtiler',
    icon: 'Mars',
    audience: 'shared',
    genderOnly: 'male',
    questions: [
      {
        type: 'single',
        key: 'prostateSymptoms',
        label: 'İdrar yapma duzeniyle ilgili prostat kaynakli sıkayetiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'mild', label: 'Hafif' },
          { value: 'moderate', label: 'Orta' },
          { value: 'severe', label: 'Belirgin' }
        ]
      },
      {
        type: 'single',
        key: 'testosteroneConcerns',
        label: 'Düşük testosteronla iliskili belirtiler yasiyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'suspect', label: 'Şüpheleniyorum' },
          { value: 'diagnosed', label: 'Tanı aldim' }
        ]
      },
      {
        type: 'single',
        key: 'maleScreening',
        label: 'Son erkek sagligi kontrolunuzu ne zaman yaptırdınız?',
        required: false,
        options: [
          { value: 'last_year', label: 'Son 1 yıl içinde' },
          { value: '1_3_years', label: '1-3 yıl once' },
          { value: 'over_3_years', label: '3 yıldan uzun' },
          { value: 'never', label: 'Hiç' }
        ]
      },
      {
        type: 'single',
        key: 'erectionQuality',
        label: 'Cinsel fonksiyonla ilgili zorlanma yasiyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'sometimes', label: 'Ara sira' },
          { value: 'often', label: 'Sık' }
        ]
      },
      {
        type: 'single',
        key: 'waistCircumferenceRisk',
        label: 'Bel cevresi olcumu konusunda risk oldugünu dusunuyor musunuz?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'not_sure', label: 'Emin değilim' },
          { value: 'yes', label: 'Evet' }
        ]
      },
      {
        type: 'single',
        key: 'snoring',
        label: 'Yüksek sesle horlama veya uykuda nefes durması şüpheleri var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'occasionally', label: 'Ara sira' },
          { value: 'frequent', label: 'Sık' }
        ]
      },
      {
        type: 'single',
        key: 'hairLossConcerns',
        label: 'Saç dökülmesi ile ilgili belirgin bir kaygınız var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'mild', label: 'Hafif' },
          { value: 'high', label: 'Belirgin' }
        ]
      },
      {
        type: 'single',
        key: 'maleFertilityPlan',
        label: 'Önümüzdeki 12 ay içinde cocuk sahibi olma planiniz var mi?',
        required: false,
        options: [
          { value: 'no', label: 'Hayır' },
          { value: 'maybe', label: 'Belki' },
          { value: 'yes', label: 'Evet' }
        ]
      }
    ]
  }
];
