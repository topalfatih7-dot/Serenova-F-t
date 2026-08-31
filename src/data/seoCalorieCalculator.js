/**
 * Public /kalori-hesaplama — copy + prerender gövdesi (React yok).
 */

export const KALORI_HESAPLAMA = {
  path: '/kalori-hesaplama',
  title: 'Kalori Hesaplama — BMR ve Günlük İhtiyaç',
  description:
    'Kalori hesaplama: Mifflin–St Jeor ile BMR ve günlük kalori ihtiyacı (TDEE). Ücretsiz; tıbbi tanı değildir. Kişiye özel plan için online diyetisyen.',
  keywords:
    'kalori hesaplama, günlük kalori ihtiyacı, BMR hesaplama, TDEE, kalori açığı, bazal metabolizma hızı',
  h1: 'Kalori hesaplama — BMR ve günlük ihtiyaç',
  lead:
    '**Kalori hesaplama**, bazal metabolizma hızı (BMR) ile aktiviteye göre günlük enerji ihtiyacını (TDEE) tahmin etmektir. Bu araç Mifflin–St Jeor formülünü kullanır; **tıbbi tanı veya kişiye özel diyet değildir**. Gebelik, hastalık veya 18 yaş altı için kullanmayın.',
  faqs: [
    { q: 'Kalori hesaplama nasıl yapılır?', a: 'BMR Mifflin–St Jeor ile yaş, cinsiyet, boy ve kilodan çıkar; aktivite çarpanıyla TDEE bulunur. Sonuç tahmindir; laboratuvar veya diyetisyen ölçümü değildir.' },
    { q: 'BMR nedir?', a: 'Bazal metabolizma hızı, dinlenme halinde organların harcadığı tahmini enerjidir. Formül popülasyon ortalamasına dayanır; kas kitlesi ve tiroid durumu sapma yaratır.' },
    { q: 'TDEE nedir?', a: 'Toplam günlük enerji harcamasıdır: BMR × aktivite çarpanı. Masa başı ile ağır antrenman aynı kiloda farklı TDEE üretir.' },
    { q: 'Kalori açığı nedir?', a: 'Alınan enerjinin TDEE’den düşük olmasıdır. Bu sayfada isteğe bağlı ~300 kcal açık, BMR’nin altına inmez. Agresif açık önermeyiz; plan diyetisyenle yapılır.' },
    { q: 'Bu araç üye kalori sayacı mı?', a: 'Hayır. Üye panelindeki kalori aracı öğün kaydı içindir ve giriş ister. Bu sayfa herkese açık BMR/TDEE tahminidir.' },
    { q: 'Sonuç kilo verdirir mi?', a: 'Hayır. Sayı bir tahmindir. Sürdürülebilir kilo yönetimi için kilo verme diyetisyeni ve video seans gerekir.' },
    { q: 'Hamileyken kullanayım mı?', a: 'Hayır. Gebelikte kalori kesme bu aracın konusu değildir. Hamilelikte beslenme sayfasına ve hekiminize bakın.' },
    { q: 'Neden online diyetisyen?', a: 'Formül kas, ilaç, uyku ve öğün düzenini bilmez. Yeni Form’da diyetisyen video görüşmeyle programı kişiye yazar.' },
  ],
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function caloriePagePlainHtml() {
  const p = KALORI_HESAPLAMA
  const faqs = p.faqs.map((f) => `<h3>${escapeHtml(f.q)}</h3><p>${escapeHtml(f.a)}</p>`).join('\n')
  return `<p>${escapeHtml(p.lead).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>
<h2>BMR ve TDEE nasıl hesaplanır?</h2>
<p>Erkek: BMR = 10×kg + 6,25×cm − 5×yaş + 5. Kadın: aynı formül, sonda −161. TDEE = BMR × aktivite (1,2 ile 1,9 arası). Hesaplayıcı tarayıcıda çalışır; kayıt gerekmez.</p>
<h2>Kalori açığı</h2>
<p>Hafif açık TDEE’den yaklaşık 300 kcal düşmektir; BMR’nin altına inilmez. Bu bir diyet reçetesi değildir.</p>
<h2>Sık sorulan sorular</h2>
${faqs}
<p><a href="/online-diyetisyen">Online diyetisyen</a> · <a href="/kilo-verme">Kilo verme</a> · <a href="/online-diyetisyen/fiyat">Diyetisyen fiyatları</a> · <a href="/beslenme/hamilelik">Hamilelikte beslenme</a></p>`
}
