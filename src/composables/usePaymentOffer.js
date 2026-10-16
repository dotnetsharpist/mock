import { ref } from 'vue'
import { fetchOffer } from '@/utils/payment'

// The public offer + privacy policy behind the payment dialog's "I accept"
// checkbox (GET /payment/offer). Read afresh every time the dialog opens, and
// again after a 409 — its `version` goes into the checkout, so it must be the
// one the student was actually shown. `offer` is null until it arrives, so a
// stale version can never be sent while a new one is loading.
export function usePaymentOffer() {
  const offer = ref(null)
  const loadFailed = ref(false)
  // Bumped on every load, so an answer to an older one is dropped.
  let request = 0

  async function load() {
    const thisRequest = ++request
    offer.value = null
    loadFailed.value = false

    try {
      const data = await fetchOffer()
      if (thisRequest === request) offer.value = data
    } catch {
      if (thisRequest === request) loadFailed.value = true
    }
  }

  return { offer, loadFailed, load }
}
