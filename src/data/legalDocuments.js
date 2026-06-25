import { BRAND } from '../config/brand'
import { SEO } from '../config/seo'

const company = BRAND.name
const email = SEO.contactEmail
const site = SEO.siteUrl

export const LEGAL_DOCUMENTS = {
  kvkk: {
    path: '/kvkk',
    title: 'KVKK Aydınlatma Metni',
    seoTitle: 'KVKK Aydınlatma Metni',
    seoDescription: `${company} kişisel verilerin korunması ve KVKK aydınlatma metni.`,
    updatedAt: '2026-06-25',
    sections: [
      {
        heading: 'Veri Sorumlusu',
        body: `${company} ("Platform") olarak 6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında veri sorumlusu sıfatıyla hareket etmekteyiz. İletişim: ${email}`,
      },
      {
        heading: 'İşlenen Kişisel Veriler',
        body: 'Kimlik ve iletişim bilgileri (ad, e-posta, telefon), sağlık ve yaşam tarzı verileri (kilo, boy, sağlık testi yanıtları, beslenme tercihleri), üyelik ve ödeme bilgileri, platform kullanım ve oturum verileri işlenebilir.',
      },
      {
        heading: 'İşleme Amaçları',
        body: 'Üyelik ve hizmet sunumu, kişiselleştirilmiş program önerileri, randevu ve görüşme yönetimi, ödeme işlemleri, destek talepleri, yasal yükümlülüklerin yerine getirilmesi ve platform güvenliği.',
      },
      {
        heading: 'Hukuki Sebepler',
        body: 'KVKK m.5/2 (sözleşmenin kurulması ve ifası), açık rıza (sağlık verileri gibi özel nitelikli veriler için), meşru menfaat ve yasal zorunluluklar.',
      },
      {
        heading: 'Aktarım',
        body: 'Ödeme hizmeti (Stripe), barındırma ve altyapı (Supabase, Vercel), iletişim (e-posta, Telegram bildirimleri) ve yasal zorunluluk halinde yetkili kurumlar. Yurt dışına aktarım yapılıyorsa KVKK m.9 hükümlerine uyulur.',
      },
      {
        heading: 'Saklama Süresi',
        body: 'Veriler, hizmet süresi boyunca ve ilgili mevzuatta öngörülen süreler kadar saklanır; süre sonunda silinir, anonimleştirilir veya arşivlenir.',
      },
      {
        heading: 'Haklarınız',
        body: 'KVKK m.11 kapsamında; verilerinizin işlenip işlenmediğini öğrenme, düzeltme, silme, itiraz ve şikâyet haklarına sahipsiniz. Taleplerinizi ' + email + ' adresine iletebilirsiniz.',
      },
    ],
  },
  privacy: {
    path: '/privacy',
    title: 'Gizlilik Politikası',
    seoTitle: 'Gizlilik Politikası',
    seoDescription: `${company} gizlilik politikası — verileriniz nasıl toplanır, kullanılır ve korunur.`,
    updatedAt: '2026-06-25',
    sections: [
      {
        heading: 'Genel',
        body: `Bu politika ${site} üzerinden sunulan ${company} hizmetlerinde toplanan bilgilerin kullanımını açıklar.`,
      },
      {
        heading: 'Toplanan Bilgiler',
        body: 'Kayıt formu, profil, sağlık testi, destek mesajları, ödeme işlemleri ve çerezler aracılığıyla teknik veriler (oturum, cihaz, sayfa görüntüleme) toplanabilir.',
      },
      {
        heading: 'Çerezler',
        body: 'Oturum yönetimi, tercihler ve analitik (Google Analytics) için çerezler kullanılabilir. Tarayıcı ayarlarınızdan çerezleri yönetebilirsiniz.',
      },
      {
        heading: 'Üçüncü Taraflar',
        body: 'Stripe (ödeme), Supabase (veritabanı), Google (analitik/AI hizmetleri), Daily.co (video görüşme) gibi hizmet sağlayıcılar yalnızca hizmet sunumu için veriye erişir.',
      },
      {
        heading: 'Güvenlik',
        body: 'Veriler şifreli bağlantı (HTTPS), satır düzeyinde erişim kontrolü (RLS) ve sunucu tarafı doğrulama ile korunur. Hiçbir sistem %100 güvenli değildir; şüpheli durumları bize bildirin.',
      },
      {
        heading: 'İletişim',
        body: `Gizlilik talepleri: ${email}`,
      },
    ],
  },
  terms: {
    path: '/terms',
    title: 'Kullanım Koşulları',
    seoTitle: 'Kullanım Koşulları ve Mesafeli Satış',
    seoDescription: `${company} üyelik koşulları, hizmet kapsamı ve yasal bilgilendirme.`,
    updatedAt: '2026-06-25',
    sections: [
      {
        heading: 'Hizmetin Niteliği',
        body: `${company} online koçluk, beslenme rehberliği ve wellness platformudur. Tıbbi teşhis, tedavi veya eczacılık hizmeti sunmaz. Sağlık sorunlarınız için hekiminize danışın.`,
      },
      {
        heading: 'Üyelik ve Hesap',
        body: 'Kayıt bilgilerinizin doğru olmasından siz sorumlusunuz. Hesap güvenliğinizi koruyun. 18 yaşından küçükler veli/vasi onayı olmadan üye olamaz.',
      },
      {
        heading: 'Ücretli Paketler',
        body: 'Paket içerikleri ve fiyatlar sitede ve ödeme ekranında gösterilir. Ödeme Stripe altyapısı ile tahsil edilir. Dijital hizmet niteliğindeki içeriklere erişim, ödeme onayı sonrası başlar.',
      },
      {
        heading: 'Cayma Hakkı',
        body: '6502 sayılı Tüketicinin Korunması Hakkında Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında, dijital içeriğe anında erişim sağlanması halinde cayma hakkı istisnaları uygulanabilir. Detaylı bilgi için ' + email + ' ile iletişime geçin.',
      },
      {
        heading: 'Fikri Mülkiyet',
        body: 'Platform içeriği, programlar ve marka unsurları ' + company + 'a aittir. İzinsiz kopyalama ve dağıtım yasaktır.',
      },
      {
        heading: 'Sorumluluk Sınırı',
        body: 'Platform "olduğu gibi" sunulur. Dolaylı zararlardan sorumluluk kabul edilmez. Yasal zorunlu haller saklıdır.',
      },
      {
        heading: 'Uyuşmazlık',
        body: 'Tüketici işlemlerinde Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri yetkilidir. İletişim: ' + email,
      },
    ],
  },
}
