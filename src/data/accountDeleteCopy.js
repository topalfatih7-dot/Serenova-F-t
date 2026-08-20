/** Hesap silme — web /hesap-silme + mobil profil aynı kopya. Destek: info@yeniform.com */

export const ACCOUNT_DELETE_SUPPORT_EMAIL = 'info@yeniform.com'
export const ACCOUNT_DELETE_PATH = '/hesap-silme'
export const ACCOUNT_DELETE_URL = 'https://www.yeniform.com/hesap-silme'

export const ACCOUNT_DELETE_COPY = {
  title: 'Hesabını sil',
  seoTitle: 'Hesabını sil — Yeni Form',
  seoDescription:
    'Yeni Form hesabınızı ve kişisel verilerinizi silme talebi. Giriş yapıp onayladıktan sonra hesap kapanır.',
  lead:
    'Bu işlem hesabınızı kapatır; sağlık kaydı, program, sohbet ve giriş bilgileriniz silinir. Üyelik iptalinden (paketi kapatmak) farklıdır.',
  bullets: [
    'Aktif ücretli paketler hemen kapanır; kalan günler iade edilmez.',
    'Bu pakete bağlı gelecek randevular iptal edilir.',
    'Sağlık testi, program, mesaj ve yüklediğiniz belgeler silinir.',
    'Yasal fatura kayıtları ödeme kuruluşunda (Stripe) saklanabilir.',
    'İşlem geri alınamaz. Yeni üyelik için yeniden kayıt gerekir.',
  ],
  legalNote:
    'KVKK kapsamındaki silme talebiniz bu sayfadan tamamlanır. Saklama esasları: Veri Saklama ve İmha Politikası.',
  loginCta: 'Giriş yap ve hesabı sil',
  loginHint: 'Play ve KVKK için bu sayfa herkese açıktır. Silme yalnızca kendi hesabınızda, girişten sonra yapılır.',
  staffBlock:
    'Personel ve yönetici hesapları bu sayfadan silinemez. Talep için info@yeniform.com adresine yazın.',
  staffMail: 'info@yeniform.com adresine yaz',
  passwordLabel: 'Şifreniz',
  passwordHint: 'Güvenlik için şifrenizi yeniden girin.',
  emailConfirmLabel: 'Hesap e-postanız',
  emailConfirmHint: 'Şifresiz giriş kullandıysanız e-posta adresinizi yazın.',
  ack:
    'Hesabımın silineceğini, ücretli paketlerimin hemen kapanacağını, iade olmayacağını ve bu işlemin geri alınamayacağını okudum, kabul ediyorum.',
  cta: 'Hesabımı kalıcı olarak sil',
  submitting: 'Hesap siliniyor…',
  doneTitle: 'Hesabınız silindi',
  doneBody:
    'Kişisel verileriniz ve girişiniz kapatıldı. İstisnai fatura / iade soruları için info@yeniform.com',
  homeCta: 'Ana sayfa',
  needAck: 'Devam etmek için onay kutusunu işaretleyin.',
  needPassword: 'Şifrenizi girin.',
  needEmail: 'Hesap e-postanızı yazın.',
  fail: 'Hesap silinemedi.',
  noSession: 'Oturum bulunamadı. Lütfen giriş yapın.',
  profileLink: 'Hesabımı sil',
  profileHint: 'Hesap ve kişisel veriler kalıcı olarak silinir.',
}
