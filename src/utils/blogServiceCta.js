/**
 * Blog yazısını ticari kümeye bağlar — fiyat yazısının pillar'ı çalmasını keser.
 */

function haystack(post) {
  return `${post?.slug || ''} ${post?.title || ''} ${post?.category || ''}`.toLocaleLowerCase('tr-TR')
}

const RULES = [
  {
    test: /fiyat|ücret|ucret|paket seç|paket sec/,
    title: 'Güncel 2026 fiyat listesi bu yazıda değil',
    text: 'Paket ve seans ücretleri online diyetisyen fiyat sayfasında; hizmetin nasıl işlediği pillar’dadır.',
    primary: { to: '/online-diyetisyen/fiyat', label: 'Diyetisyen fiyatları' },
    secondary: { to: '/online-diyetisyen', label: 'Online diyetisyen nedir?' },
  },
  {
    test: /pcos|polikistik/,
    title: 'PCOS beslenmesi küme sayfası',
    text: 'Polikistik over için beslenme çerçevesi ve diyetisyen süreci ayrı rehberdedir.',
    primary: { to: '/beslenme/pcos', label: 'PCOS diyeti' },
    secondary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
  },
  {
    test: /insülin|insulin direnc/,
    title: 'İnsülin direnci beslenmesi',
    text: 'Öğün ve glisemik çerçeve küme sayfasında; tıbbi tedavi hekimdedir.',
    primary: { to: '/beslenme/insulin-direnci', label: 'İnsülin direnci diyeti' },
    secondary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
  },
  {
    test: /hamile|gebelik/,
    title: 'Hamilelikte beslenme rehberi',
    text: 'Gebelikte kalori kesme yok; trimester çerçeve ve diyetisyen süreci ayrı sayfadadır.',
    primary: { to: '/beslenme/hamilelik', label: 'Hamilelikte beslenme' },
    secondary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
  },
  {
    test: /kalori aç|kalori ac|bmr|tdee|kalori hesap/,
    title: 'BMR ve günlük kalori hesabı',
    text: 'Ücretsiz kalori hesaplama aracında BMR ve TDEE tahminini görün.',
    primary: { to: '/kalori-hesaplama', label: 'Kalori hesaplama' },
    secondary: { to: '/kilo-verme', label: 'Kilo verme diyetisyeni' },
  },
  {
    test: /kilo ver|zayıfla|zayifla/,
    title: 'Kilo verme diyetisyeni',
    text: 'Sürdürülebilir program ve video seans süreci kilo verme sayfasındadır.',
    primary: { to: '/kilo-verme', label: 'Kilo verme' },
    secondary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
  },
  {
    test: /koçluk|kocluk|fitness koçu|spor koçu|evde antrenman/,
    title: 'Online koçluk hizmeti',
    text: 'Video koçluk ve ev programı hizmet sayfalarındadır; bu yazı genel bilgilendirmedir.',
    primary: { to: '/online-kocluk', label: 'Online koçluk' },
    secondary: { to: '/online-kocluk/ev-antrenman', label: 'Evde antrenman' },
  },
  {
    test: /diyetisyen|online diyet/,
    title: 'Online diyetisyen hizmeti',
    text: 'Video görüşme ve program süreci pillar sayfadadır. Fiyat için ayrı URL kullanın.',
    primary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
    secondary: { to: '/online-diyetisyen/fiyat', label: '2026 fiyatları' },
  },
]

export function blogServiceCta(post) {
  const h = haystack(post)
  return RULES.find((r) => r.test.test(h)) || {
    title: 'Uzmanla devam edin',
    text: 'Yeni Form’da online diyetisyen ve online koçluk video görüşmeyle yürür.',
    primary: { to: '/online-diyetisyen', label: 'Online diyetisyen' },
    secondary: { to: '/online-kocluk', label: 'Online koçluk' },
  }
}
