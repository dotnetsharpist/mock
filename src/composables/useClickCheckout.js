import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { isNetworkError } from '@/utils/api'
import { createCheckout, PAYMENT_PROVIDER_CLICK } from '@/utils/payment'

// "Click orqali to'lash": create a checkout, then leave for Click in this tab.
// Shared by PricingPaymentModal and the result page's "try again", so both
// start a payment the same way and fail with the same words.
export function useClickCheckout() {
  const { t } = useI18n()
  const isStarting = ref(false)
  const error = ref('')

  // Back from Click with the browser's back button, the page can come out of
  // the back/forward cache exactly as it left: button still spinning. Let the
  // student press it again — that makes a new checkout, as it must.
  const onPageShow = (event) => {
    if (event.persisted) isStarting.value = false
  }
  onMounted(() => window.addEventListener('pageshow', onPageShow))
  onBeforeUnmount(() => window.removeEventListener('pageshow', onPageShow))

  async function start(tariffCode) {
    if (isStarting.value) return
    isStarting.value = true
    error.value = ''

    try {
      const { paymentUrl } = await createCheckout(tariffCode, PAYMENT_PROVIDER_CLICK)
      // Stays "starting" on purpose: the page is unloading.
      window.location.href = paymentUrl
    } catch (err) {
      isStarting.value = false
      // apiFetch is already taking them to /login.
      if (err?.status === 401) return
      error.value = t(`pricing.payment.click.errors.${checkoutErrorKind(err)}`)
    }
  }

  function clearError() {
    error.value = ''
  }

  return { start, isStarting, error, clearError }
}

function checkoutErrorKind(error) {
  if (isNetworkError(error)) return 'network'
  if (error?.status === 404) return 'unknownTariff'
  if (error?.status === 400) return 'providerUnavailable'
  return 'generic'
}
