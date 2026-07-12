/**
 * Sağlık testi sonrası senkron — şu anlık AI analiz / program üretimi YOK.
 * Test cevapları `saveHealthTestProgress` / `updateProfile` ile kaydedilir;
 * ham cevaplar personel ve üye sağlık profilinde gösterilir.
 */

import { isHealthTestComplete } from '../data/healthTest'

export function profileReadyForAnalysis(profile) {
  return isHealthTestComplete(profile?.healthTest, profile?.gender, profile?.packageConfig)
}

/**
 * @deprecated AI sağlık analizi ve otomatik program şu an kapalı.
 * Çağıranlar no-op alır; test verisi zaten ayrı kaydedilir.
 */
export async function syncMemberHealthAssets() {
  return { synced: false, reason: 'disabled' }
}
