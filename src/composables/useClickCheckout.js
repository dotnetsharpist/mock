import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNetworkError } from '@/utils/api'
import { createCheckout, PAYMENT_PROVIDER_CLICK } from '@/utils/payment'

// "Click orqali to'lash": create a checkout, then leave for Click in this tab.
// Used by PricingPaymentModal — the result page's "try again" reopens that
// dialog, so every payment passes the same offer checkbox.
//
// `error` is the words to show; `errorKind` says where they belong. The two
// offer kinds are about the checkbox, so the dialog shows them under it:
//   offerRequired  400 — the server saw no acceptance
//   offerChanged   409 — the offer changed while the dialog was open; the
//                  dialog re-reads it and asks for the tick again
export function useClickCheckout() {
  const { t } = useI18n()
  const isStarting = ref(false)
  const error = ref('')
  const errorKind = ref('')

  // Back from Click with the browser's back button, the page can come out of
  // the back/forward cache exactly as it left: button still spinning. Let the
  // student press it again — that makes a new checkout, as it must.
  const onPageShow = (event) => {
    if (event.persisted) isStarting.value = false
  }
  onMounted(() => window.addEventListener('pageshow', onPageShow))
  onBeforeUnmount(() => window.removeEventListener('pageshow', onPageShow))

  async function start(tariffCode, offerVersion) {
    if (isStarting.value) return
    isStarting.value = true
    clearError()

    try {
      const { paymentUrl } = await createCheckout(tariffCode, {
        offerVersion,
        provider: PAYMENT_PROVIDER_CLICK,
      })
      // Stays "starting" on purpose: the page is unloading.
      window.location.href = paymentUrl
    } catch (err) {
      isStarting.value = false
      // apiFetch is already taking them to /login.
      if (err?.status === 401) return
      errorKind.value = checkoutErrorKind(err)
      error.value = t(`pricing.payment.click.errors.${errorKind.value}`)
    }
  }

  function clearError() {
    error.value = ''
    errorKind.value = ''
  }

  return { start, isStarting, error, errorKind, clearError }
}

// The backend answers three different problems with a 400; only the message
// tells them apart, so it is matched loosely (like codeChannelFromMessage).
function checkoutErrorKind(error) {
  if (isNetworkError(error)) return 'network'
  if (error?.status === 409) return 'offerChanged'
  if (error?.status === 404) return 'unknownTariff'
  if (error?.status === 400) {
    const message = String(error?.message || '')
    // "Payments are temporarily unavailable" — the server's own setup is
    // broken; nothing the student did or can fix by switching provider.
    if (/temporarily unavailable/i.test(message)) return 'generic'
    // "Accept the public offer…"
    if (/offer/i.test(message)) return 'offerRequired'
    return 'providerUnavailable'
  }
  return 'generic'
}
