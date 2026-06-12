import { addDays, subDays, format } from 'date-fns'
import { tr } from 'date-fns/locale'

const now = new Date()

export const defaultUser = {
  id: 'user-1',
  name: 'Ayşe Yılmaz',
  email: 'ayse@example.com',
  age: 32,
  city: 'İstanbul',
  goals: ['weight', 'confidence'],
  fitnessLevel: 'beginner',
  nutritionPrefs: ['balanced', 'no-pork'],
  healthNotes: [],
  avatar: null,
  streak: 14,
  joinedAt: '2026-01-15',
}

export const mockCoachSessions = [
  { id: 'cs-1', type: 'coach', title: 'Haftalık Check-in', date: addDays(now, 2), duration: 30, status: 'scheduled', coach: 'Elif Kaya' },
  { id: 'cs-2', type: 'coach', title: 'Form Analizi', date: addDays(now, 5), duration: 45, status: 'scheduled', coach: 'Elif Kaya' },
  { id: 'cs-3', type: 'coach', title: 'Motivasyon Görüşmesi', date: subDays(now, 3), duration: 30, status: 'completed', coach: 'Elif Kaya' },
  { id: 'cs-4', type: 'coach', title: 'Program Güncelleme', date: addDays(now, 9), duration: 30, status: 'scheduled', coach: 'Elif Kaya' },
]

export const mockDietitianSessions = [
  { id: 'ds-1', type: 'dietitian', title: 'Beslenme Değerlendirmesi', date: addDays(now, 8), duration: 40, status: 'scheduled', coach: 'Dr. Zeynep Arslan' },
  { id: 'ds-2', type: 'dietitian', title: 'Makro Ayarlama', date: subDays(now, 22), duration: 40, status: 'completed', coach: 'Dr. Zeynep Arslan' },
]

export const mockCalendarEvents = [
  { id: 'ev-1', title: 'Koç Görüşmesi', date: addDays(now, 2), type: 'coach', color: '#d44d8a' },
  { id: 'ev-2', title: 'Alt Vücut Antrenmanı', date: addDays(now, 1), type: 'workout', color: '#5f9270' },
  { id: 'ev-3', title: 'Su Hatırlatıcısı', date: now, type: 'reminder', color: '#b8924f' },
  { id: 'ev-4', title: 'Diyetisyen Randevusu', date: addDays(now, 8), type: 'dietitian', color: '#9a285c' },
  { id: 'ev-5', title: 'Haftalık Check-in', date: addDays(now, 4), type: 'checkin', color: '#7daa88' },
  { id: 'ev-6', title: 'Grup Yoga', date: addDays(now, 6), type: 'group', color: '#c9a86c' },
]

export const mockNotifications = [
  { id: 'n-1', type: 'reminder', title: 'Bugünkü antrenmanınız hazır', message: 'Alt vücut güç antrenmanı sizi bekliyor.', read: false, createdAt: subDays(now, 0) },
  { id: 'n-2', type: 'motivation', title: 'Harika gidiyorsun!', message: '14 günlük seriniz devam ediyor. Gurur duyun.', read: false, createdAt: subDays(now, 0) },
  { id: 'n-3', type: 'no-response', title: 'Sizi özledik', message: '3 gündür aktivite kaydı girmediniz. Nasıl yardımcı olabiliriz?', read: false, createdAt: subDays(now, 1) },
  { id: 'n-4', type: 'renewal', title: 'Üyeliğiniz 14 gün içinde sona eriyor', message: 'Kesintisiz devam etmek için yenileyin.', read: true, createdAt: subDays(now, 2) },
  { id: 'n-5', type: 'upsell', title: 'Premium\'a geçin', message: 'Birebir koç desteği ile hedefinize daha hızlı ulaşın.', read: true, createdAt: subDays(now, 3) },
  { id: 'n-6', type: 'health-warning', title: 'Sağlık bildirimi', message: 'Yaralanma bildirdiniz. Programınız geçici olarak hafifletildi. Doktorunuza danışmayı unutmayın.', read: false, createdAt: subDays(now, 1) },
  { id: 'n-7', type: 'missed', title: 'Kaçırılan aktivite', message: 'Dün planlanan kardiyo seansını tamamlamadınız.', read: true, createdAt: subDays(now, 2) },
]

export const mockProgress = {
  weight: [
    { date: 'Oca', value: 78.5 },
    { date: 'Şub', value: 77.2 },
    { date: 'Mar', value: 76.1 },
    { date: 'Nis', value: 75.4 },
    { date: 'May', value: 74.8 },
    { date: 'Haz', value: 74.2 },
  ],
  workouts: [
    { week: 'H1', completed: 4, planned: 5 },
    { week: 'H2', completed: 5, planned: 5 },
    { week: 'H3', completed: 4, planned: 5 },
    { week: 'H4', completed: 5, planned: 5 },
  ],
  checkins: [
    { week: 'H1', rate: 80 },
    { week: 'H2', rate: 90 },
    { week: 'H3', rate: 75 },
    { week: 'H4', rate: 95 },
  ],
  mood: [
    { day: 'Pzt', energy: 7, mood: 8 },
    { day: 'Sal', energy: 6, mood: 7 },
    { day: 'Çar', energy: 8, mood: 8 },
    { day: 'Per', energy: 7, mood: 9 },
    { day: 'Cum', energy: 8, mood: 8 },
    { day: 'Cmt', energy: 9, mood: 9 },
    { day: 'Paz', energy: 7, mood: 8 },
  ],
}

export const mockTasks = [
  { id: 't-1', type: 'workout', title: 'Alt vücut güç antrenmanı', done: false, due: 'Bugün' },
  { id: 't-2', type: 'meal', title: 'Öğle yemeği kaydı', done: true, due: 'Bugün' },
  { id: 't-3', type: 'water', title: '2L su hedefi', done: false, due: 'Bugün', progress: 1.2, target: 2 },
  { id: 't-4', type: 'checkin', title: 'Günlük check-in', done: false, due: 'Bugün' },
]

export const mockFAQs = [
  { q: 'Bu program tıbbi tedavi midir?', a: 'Hayır. Serenova Fit Dönüşüm bir koçluk ve wellness platformudur. Tıbbi teşhis veya tedavi sunmaz. Sağlık sorunlarınız için mutlaka doktorunuza danışın.' },
  { q: 'Ücretsiz ve Premium arasındaki fark nedir?', a: 'Ücretsiz üyelik temel planlar ve topluluk erişimi sunar. Premium üyelik birebir koç ve diyetisyen görüşmeleri, detaylı takvim, ilerleme raporları ve öncelikli destek içerir.' },
  { q: 'Üyeliğimi duraklatabilir miyim?', a: 'Evet. Tatil veya sağlık nedeniyle üyeliğinizi geçici olarak dondurabilirsiniz. Destek merkezinden veya profil ayarlarından talep oluşturabilirsiniz.' },
  { q: 'İptal ve iade politikası nasıl?', a: 'İlk 7 gün içinde koşulsuz iade hakkınız vardır. Sonrasında kullanılan süre düşülerek kısmi iade uygulanır.' },
  { q: 'Beslenme önerileri kişiye özel midir?', a: 'Premium üyelerde diyetisyen destekli kişiselleştirilmiş rehberlik sunulur. Bu öneriler genel bilgilendirme amaçlıdır ve tıbbi tedavi yerine geçmez.' },
  { q: 'Yaralanma durumunda ne olur?', a: 'Yaralanma veya sağlık sorunu bildirdiğinizde programınız geçici olarak hafifletilir veya duraklatılır. Doktor onayı önerilir.' },
]

export const mockTestimonials = [
  { id: 't1', name: 'Selin A.', role: 'Premium Üye · 6 ay', quote: 'Koç desteği sayesinde düzenli antrenman alışkanlığı kazandım. Kendimi daha güçlü hissediyorum.', rating: 5 },
  { id: 't2', name: 'Mehmet K.', role: 'Premium Üye · 4 ay', quote: 'Esnek program ve nazik hatırlatmalar motivasyonumu koruyor. Evde rahatça devam edebiliyorum.', rating: 5 },
  { id: 't3', name: 'Deniz T.', role: 'Ücretsiz Üye', quote: 'Ücretsiz planla başladım, topluluk çok destekleyici. Premium\'a geçmeyi düşünüyorum.', rating: 4 },
]

export const mockSuccessStories = [
  { id: 's1', name: 'Ece R.', duration: '16 hafta', highlight: 'Düzenli antrenman alışkanlığı', timeline: ['Programa başladı', 'Haftalık koç görüşmeleri', 'Beslenme rutini oluştu', 'Hedef kiloya yaklaştı'], consent: true, approved: true },
  { id: 's2', name: 'Burcu M.', duration: '12 hafta', highlight: 'Özgüven ve enerji artışı', timeline: ['İlk değerlendirme', 'Kişisel plan oluşturuldu', 'Grup seanslarına katıldı', 'Yeni rutinini sürdürüyor'], consent: true, approved: true },
  { id: 's3', name: 'Gizem S.', duration: '8 hafta', highlight: 'Sağlıklı yaşam rutini', timeline: ['Ücretsizden Premium\'a geçti', 'Diyetisyen desteği aldı', 'Haftalık ilerleme takibi'], consent: true, approved: false },
]

export const defaultTeam = [
  { id: 'team-1', role: 'coach', name: 'Elif Kaya', specialty: 'Güç & Fonksiyonel Antrenman', bio: 'Sertifikalı kişisel antrenör. Ev ve salon programlarıyla sürdürülebilir form kazandırır.', photo: '/team/team-coach-1.png' },
  { id: 'team-2', role: 'coach', name: 'Mert Demir', specialty: 'Kondisyon & Kilo Yönetimi', bio: 'Kardiyo ve kuvvet dengesiyle, her seviyeye uygun motive edici antrenman planları.', photo: '/team/team-coach-2.png' },
  { id: 'team-3', role: 'dietitian', name: 'Dr. Zeynep Arslan', specialty: 'Klinik Beslenme', bio: 'Kişiye özel, dengeli beslenme programlarıyla kalıcı sağlıklı alışkanlıklar oluşturur.', photo: '/team/team-dietitian-1.png' },
  { id: 'team-4', role: 'dietitian', name: 'Can Yıldız', specialty: 'Sporcu Beslenmesi', bio: 'Performans ve toparlanma odaklı beslenme stratejileriyle hedeflerinize destek olur.', photo: '/team/team-dietitian-2.png' },
]

export const howItWorks = [
  { step: 1, title: 'Kayıt Ol', desc: 'Hedeflerinizi ve tercihlerinizi paylaşın' },
  { step: 2, title: 'Plan Seçin', desc: 'Ücretsiz veya özelleştirilmiş Premium paket' },
  { step: 3, title: 'Koçunuzla Tanışın', desc: 'Kişisel programınız oluşturulur' },
  { step: 4, title: 'Takip Edin', desc: 'Antrenman, beslenme ve ilerlemenizi izleyin' },
]

export function formatDateTR(date) {
  return format(date, 'd MMMM yyyy, HH:mm', { locale: tr })
}
