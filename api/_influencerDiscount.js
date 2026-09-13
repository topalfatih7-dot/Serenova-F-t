import { isSelfInfluencerUse } from './_influencerCode.js'
import {
  INFLUENCER_DISCOUNT_CLAIMED_ERROR,
  memberHasClaimedInfluencerDiscount,
} from '../src/data/influencerPayouts.js'

/**
 * Checkout + kod doğrulama ortak kapı.
 * İndirim yalnızca başarılı ilk ödemede bir kez; terk edilmiş checkout sayılmaz.
 */
export function influencerDiscountGate({ user, influencerRow, memberData } = {}) {
  if (!influencerRow) {
    return { ok: false, error: 'Geçersiz kod.' }
  }
  if (isSelfInfluencerUse(user, influencerRow)) {
    return { ok: false, error: 'Kendi kodunuzu kullanamazsınız.' }
  }
  if (memberHasClaimedInfluencerDiscount(memberData)) {
    return { ok: false, error: INFLUENCER_DISCOUNT_CLAIMED_ERROR, claimed: true }
  }
  return { ok: true }
}
