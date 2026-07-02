const nowISO = () => new Date().toISOString()

function notificationSeed(type, title, message, extra = {}) {
  return {
    id: `n-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    title,
    message,
    read: false,
    createdAt: nowISO(),
    ...extra,
  }
}

/** Yeni üye kaydında gönderilen ilk bildirimler (hoş geldin + müsaitlik). */
export function buildInitialMemberNotifications() {
  return [
    notificationSeed(
      'reminder',
      'Yeni Form’a hoş geldiniz!',
      'Profiliniz hazır. Günlük görevlerinizi tamamlayarak serinizi büyütmeye başlayın.',
    ),
    notificationSeed(
      'availability',
      'Antrenman günlerinizi paylaşın',
      'Koçunuz size doğru antrenman programı hazırlayabilsin diye antrenman yapabileceğiniz gün ve saatleri lütfen doldurun.',
      { action: 'availability' },
    ),
  ]
}
