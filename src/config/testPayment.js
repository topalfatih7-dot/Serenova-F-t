/** Test ortamı için kabul edilen örnek kart bilgileri */
export const TEST_CARD = {
  number: '4242424242424242',
  numberFormatted: '4242 4242 4242 4242',
  expiry: '12/28',
  cvv: '123',
  holder: 'TEST KULLANICI',
}

export function normalizeCardNumber(value) {
  return (value || '').replace(/\s/g, '')
}

export function validateTestPayment({ cardNumber, expiry, cvv }) {
  const errors = {}
  const normalized = normalizeCardNumber(cardNumber)

  if (normalized !== TEST_CARD.number) {
    errors.cardNumber = `Geçersiz kart. Test kartı: ${TEST_CARD.numberFormatted}`
  }

  const exp = (expiry || '').replace(/\s/g, '')
  if (exp !== TEST_CARD.expiry && exp !== '12/2028') {
    errors.expiry = `Geçersiz tarih. Test: ${TEST_CARD.expiry}`
  }

  if ((cvv || '').trim() !== TEST_CARD.cvv) {
    errors.cvv = `Geçersiz CVV. Test: ${TEST_CARD.cvv}`
  }

  return { valid: Object.keys(errors).length === 0, errors }
}
