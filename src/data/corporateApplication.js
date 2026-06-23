export const CORPORATE_INDUSTRIES = [
  'Teknoloji', 'Finans', 'Üretim', 'Perakende', 'Sağlık', 'Eğitim', 'Hizmet', 'Kamu', 'Diğer',
]

export const EMPLOYEE_RANGES = [
  { id: '10-50', label: '10–50 çalışan' },
  { id: '51-200', label: '51–200 çalışan' },
  { id: '201-500', label: '201–500 çalışan' },
  { id: '500+', label: '500+ çalışan' },
]

export const CORPORATE_SERVICES = [
  'Çalışan wellness programı',
  'Kurumsal koçluk paketi',
  'Diyetisyen & beslenme atölyeleri',
  'Yönetici / executive coaching',
  'Online grup antrenmanları',
  'Özel fiyatlandırma teklifi',
]

export const EMPTY_CORPORATE_APPLICATION = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  city: '',
  industry: '',
  employeeRange: '',
  services: [],
  message: '',
  preferredStart: '',
}

export function validateCorporateApplication(form) {
  const errors = []
  if (!form.companyName?.trim()) errors.push('Şirket adı gerekli')
  if (!form.contactName?.trim()) errors.push('Yetkili adı gerekli')
  if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('Geçerli e-posta gerekli')
  if (!form.phone?.trim()) errors.push('Telefon gerekli')
  if (!form.city?.trim()) errors.push('Şehir gerekli')
  if (!form.industry) errors.push('Sektör seçin')
  if (!form.employeeRange) errors.push('Çalışan sayısı aralığı seçin')
  if (!(form.services || []).length) errors.push('En az bir hizmet seçin')
  if (!form.message?.trim() || form.message.trim().length < 20) errors.push('İhtiyaçlarınızı en az 20 karakter ile açıklayın')
  return errors
}
