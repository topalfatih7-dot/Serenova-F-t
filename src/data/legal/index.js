import antrenor from './antrenor-hizmet-standartlari.js'
import diyetisyen from './diyetisyen-hizmet-standartlari.js'
import cerez from './cerez-politikasi.js'
import gizlilik from './gizlilik-politikasi.js'
import iptal from './iptal-ve-iade-politikasi.js'
import kvkkAcik from './kvkk-acik-riza-metni.js'
import kvkk from './kvkk.js'
import mesafeli from './mesafeli-hizmet-sozlesmesi.js'
import saglikReddi from './saglik-sorumluluk-reddi.js'
import saglikVeri from './saglik-verisi-isleme-bilgilendirmesi.js'
import topluluk from './topluluk-kurallari.js'
import uyelik from './uyelik-ve-abonelik-sozlesmesi.js'
import veriSaklama from './veri-saklama-ve-imha-politikasi.js'
import yapayZeka from './yapay-zeka-kullanim-politikasi.js'

export const LEGAL_DOCUMENTS = {
  'antrenor-hizmet-standartlari': antrenor,
  'diyetisyen-hizmet-standartlari': diyetisyen,
  'cerez-politikasi': cerez,
  'gizlilik-politikasi': gizlilik,
  'iptal-ve-iade-politikasi': iptal,
  'kvkk-acik-riza-metni': kvkkAcik,
  'kvkk': kvkk,
  'mesafeli-hizmet-sozlesmesi': mesafeli,
  'saglik-sorumluluk-reddi': saglikReddi,
  'saglik-verisi-isleme-bilgilendirmesi': saglikVeri,
  'topluluk-kurallari': topluluk,
  'uyelik-ve-abonelik-sozlesmesi': uyelik,
  'veri-saklama-ve-imha-politikasi': veriSaklama,
  'yapay-zeka-kullanim-politikasi': yapayZeka,
}

export const LEGAL_FOOTER_GROUPS = [
  { label: 'Sözleşmeler', links: [
    { slug: 'uyelik-ve-abonelik-sozlesmesi', label: 'Üyelik ve Abonelik Sözleşmesi' },
    { slug: 'mesafeli-hizmet-sozlesmesi', label: 'Mesafeli Hizmet Sözleşmesi' },
    { slug: 'iptal-ve-iade-politikasi', label: 'İptal ve İade Politikası' },
  ]},
  { label: 'Gizlilik ve Veri', links: [
    { slug: 'kvkk', label: 'KVKK Aydınlatma Metni' },
    { slug: 'kvkk-acik-riza-metni', label: 'KVKK Açık Rıza Metni' },
    { slug: 'gizlilik-politikasi', label: 'Gizlilik Politikası' },
    { slug: 'cerez-politikasi', label: 'Çerez Politikası' },
    { slug: 'saglik-verisi-isleme-bilgilendirmesi', label: 'Sağlık Verisi İşleme Bilgilendirmesi' },
    { slug: 'veri-saklama-ve-imha-politikasi', label: 'Veri Saklama ve İmha Politikası' },
    { slug: 'yapay-zeka-kullanim-politikasi', label: 'Yapay Zekâ Kullanım Politikası' },
  ]},
  { label: 'Platform', links: [
    { slug: 'topluluk-kurallari', label: 'Topluluk Kuralları' },
    { slug: 'saglik-sorumluluk-reddi', label: 'Sağlık Sorumluluk Reddi' },
    { slug: 'antrenor-hizmet-standartlari', label: 'Antrenör Hizmet Standartları' },
    { slug: 'diyetisyen-hizmet-standartlari', label: 'Diyetisyen Hizmet Standartları' },
  ]},
]

/** Footer’da paragraf olarak gösterilecek yasal metin grupları. */
export const LEGAL_FOOTER_PARAGRAPHS = [
  {
    intro: 'Üyelik, abonelik ve ücretli dijital hizmetlere ilişkin koşullar için',
    outro: 'metinlerine aşağıdaki bağlantılardan ulaşabilirsiniz.',
    links: LEGAL_FOOTER_GROUPS[0].links,
  },
  {
    intro: 'Kişisel verilerinizin işlenmesi, gizlilik, çerez kullanımı ve veri saklama esaslarına ilişkin',
    outro: 'dokümanlarını inceleyebilirsiniz.',
    links: LEGAL_FOOTER_GROUPS[1].links,
  },
  {
    intro: 'Güvenli ve saygılı bir topluluk ortamı ile uzman hizmet kalitesine ilişkin',
    outro: 'metinler platformumuzda yayımlanmaktadır.',
    links: LEGAL_FOOTER_GROUPS[2].links,
  },
]

export function getLegalMembershipNotice(brandName) {
  return [
    `${brandName} platformuna üye olmak, hesap oluşturmak, ücretli paketlere kayıt olmak ya da ödeme adımını tamamlamak suretiyle; Üyelik ve Abonelik Sözleşmesi, Mesafeli Hizmet Sözleşmesi, KVKK Aydınlatma Metni, Gizlilik Politikası, Çerez Politikası, Sağlık Sorumluluk Reddi, Topluluk Kuralları, İptal ve İade Politikası ile platformda yayımlanan diğer tüm politika, bilgilendirme ve hizmet standartlarını okuduğunuzu, anladığınızı ve bağlayıcı şekilde kabul etmiş sayıldığınızı beyan etmiş olursunuz. Özel nitelikli kişisel veriler (sağlık verileri vb.) için ayrıca KVKK Açık Rıza Metni kapsamında gerekli onayları vermiş sayılırsınız.`,
    'Bu metinler zaman zaman güncellenebilir; güncel sürümler platform üzerinde yayımlandığı tarihten itibaren geçerlidir. Platform tıbbi teşhis veya tedavi hizmeti sunmaz; sunulan içerikler genel wellness ve yaşam tarzı rehberliği niteliğindedir.',
  ]
}
