import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNetworkError } from '@/utils/api'
import { createCheckout } from '@/utils/payment'

// "Click / Payme orqali to'lash": create a checkout with that provider, then
// leave for its page in this tab. Used by PricingPaymentModal — the result
// page's "try again" reopens that dialog, so every payment passes the same
// offer checkbox.
//
// `startingProvider` is the provider whose checkout is on its way ('' when
// none), so the dialog spins only the button that was pressed.
// `error` is the words to show; `errorKind` says where they belong. The two
// offer kinds are about the checkbox, so the dialog shows them under it:
//   offerRequired  400 — the server saw no acceptance
//   offerChanged   409 — the offer changed while the dialog was open; the
//                  dialog re-reads it and asks for the tick again
export function usePaymentCheckout() {
  const { t } = useI18n()
  const startingProvider = ref('')
  const isStarting = computed(() => Boolean(startingProvider.value))
  const errorKind = ref('')
  // The provider the failed checkout was for. The words are derived, not
  // stored, so an error on screen follows a language switch.
  const errorProvider = ref('')
  const error = computed(() =>
    errorKind.value
      ? t(`pricing.payment.gateway.errors.${errorKind.value}`, { provider: errorProvider.value })
      : '',
  )

  // Back from the provider with the browser's back button, the page can come
  // out of the back/forward cache exactly as it left: button still spinning.
  // Let the student press it again — that makes a new checkout, as it must.
  const onPageShow = (event) => {
    if (event.persisted) startingProvider.value = ''
  }
  onMounted(() => window.addEventListener('pageshow', onPageShow))
  onBeforeUnmount(() => window.removeEventListener('pageshow', onPageShow))

  async function start(tariffCode, offerVersion, provider) {
    if (isStarting.value) return
    startingProvider.value = provider
    clearError()

    try {
      const { paymentUrl } = await createCheckout(tariffCode, { offerVersion, provider })
      // Stays "starting" on purpose: the page is unloading.
      window.location.href = paymentUrl
    } catch (err) {
      startingProvider.value = ''
      // apiFetch is already taking them to /login.
      if (err?.status === 401) return
      errorProvider.value = provider
      errorKind.value = checkoutErrorKind(err)
    }
  }

  function clearError() {
    errorKind.value = ''
    errorProvider.value = ''
  }

  return { start, startingProvider, isStarting, error, errorKind, clearError }
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
