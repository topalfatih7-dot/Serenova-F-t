/** Üyelik iptali — web + mobil aynı kopya. Destek: info@yeniform.com */

export const MEMBERSHIP_CANCEL_SUPPORT_EMAIL = 'info@yeniform.com'

export const MEMBERSHIP_CANCEL_COPY = {
  packagesTitle: 'Aktif paketleriniz',
  independentNote:
    'Her paket ayrı faturalanır. Birini kapatmak diğerinin çekimini durdurmaz.',
  cardInvoice: 'Kart ve fatura',
  closeRenewal: 'Otomatik yenilemeyi kapat',
  closeNow: 'Hemen kapat',
  keepRenewal: 'Yenilemeyi açık tut',
  addPackage: 'Paket ekle / satın al',
  buyCta: 'Web’den paket ekle',
  manageNote:
    'Satın alma web üzerinden yapılır. İptal için aşağıdaki uyarıları okuyup Stripe Müşteri Portalı’nda onaylarsınız.',
  doctorTitle: 'Doktor Paketi tek seferliktir',
  doctorBody:
    'Bu paket abonelik değildir; self-servis iptal yoktur. İptal veya iade için info@yeniform.com adresine yazın.',
  doctorMail: 'info@yeniform.com adresine yaz',
  renewalOffBadge: 'Yenileme kapalı',
  renewalOffBanner: (dateLabel, planLabel) =>
    `${planLabel}: yenileme kapalı · ${dateLabel} tarihine kadar erişiminiz sürer.`,
  stackingTitle: 'Mevcut paketleriniz durur',
  stackingBody:
    'Bu satın alma mevcut aboneliklerinizi kapatmaz. İstemediğiniz paketi önce Ödeme Yönetimi’nden kapatın. Unutursanız her paket kendi döneminde kartınızdan çekilmeye devam eder.',
  stackingAck: 'Mevcut paketlerimin durduğunu ve ayrı faturalanacağını anlıyorum.',
  periodTitle: 'Otomatik yenilemeyi kapat',
  periodLead: (planLabel, dateLabel) =>
    `${planLabel} aboneliğiniz ${dateLabel} tarihinde sona erecek. O güne kadar erişiminiz açık kalır; bu paket için yeni çekim olmaz.`,
  periodBullets: [
    'Diğer paketleriniz etkilenmez; kapatmadıklarınız çekilmeye devam eder.',
    'Bitiş tarihinden önce Ödeme Yönetimi’nden yenilemeyi tekrar açabilirsiniz.',
    'Onay Stripe Müşteri Portalı’nda tamamlanır.',
  ],
  periodCta: 'Portal’da onayla',
  immediateTitle: 'Üyeliği hemen kapat',
  immediateLead: (planLabel, dateLabel) =>
    `${planLabel} süreniz ${dateLabel} tarihine kadar ödenmiş. Hemen kapatırsanız erişim bugün kesilir; ödenen ücret iade edilmez.`,
  immediateBullets: [
    'Kalan günler yanar; para iadesi yoktur.',
    'Yarınki görüşmeniz dahil bu pakete bağlı gelecek randevular iptal edilir.',
    'Koç / diyetisyen hakkı bu paketten düşer. Başka aktif paketiniz varsa onlar durur.',
    'Bu işlem geri alınamaz.',
    'İstisnai durumlar için info@yeniform.com',
  ],
  immediateAck:
    'Erişimin bugün kesileceğini, iade olmayacağını ve gelecek randevuların iptal edileceğini okudum, kabul ediyorum.',
  immediateCta: 'Portal’da hemen kapat',
  resumeTitle: 'Yenilemeyi açık tut',
  resumeLead: (planLabel, dateLabel) =>
    `${planLabel} için yenileme yeniden açılır. ${dateLabel} tarihinde kartınızdan dönem tutarı çekilir ve erişim devam eder.`,
  resumeCta: 'Yenilemeyi aç',
  resumedToast: 'Yenileme yeniden açıldı.',
  portalFail: 'Portal açılamadı.',
  resumeFail: 'Yenileme açılamadı.',
  noSession: 'Oturum bulunamadı. Lütfen tekrar giriş yapın.',
  needAck: 'Devam etmek için onay kutusunu işaretleyin.',
  durationHint:
    'Kartınızdan seçtiğiniz dönem tutarı tahsil edilir. İptal etmezseniz süre sonunda güncel paket fiyatı çekilir. İptal: Ödeme Yönetimi’nde uyarıları okuyun, ardından Stripe Portalı’nda onaylayın.',
  nextChargeLabel: 'Sonraki çekim',
}
