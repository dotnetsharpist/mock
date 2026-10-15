import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchTariffs, formatSom } from '@/utils/payment'
import { TEST_TOKEN_COST } from '@/utils/premium'

// The tanga packs, for /narxlar and /tanga alike.
//
// What is for sale, and at what price, is the backend's: GET /payment/tariffs.
// The words around a pack — its localised name, its features, the "popular" /
// "best value" badge — are ours, in i18n `pricing.plans`, and attach to a
// tariff by tanga count. Until the tariffs arrive (or if they never do) the
// i18n plans are shown as they are, prices included, so the page never waits
// on this call.
//
// Module-level so the two pages share one request per visit.
const tariffs = ref(null)
let pending = null

function loadTariffs() {
  if (tariffs.value || pending) return
  pending = fetchTariffs()
    .then((list) => {
      if (list.length) tariffs.value = list
    })
    .catch(() => {})
    .finally(() => {
      pending = null
    })
}

export function usePricingPlans() {
  const { t, tm } = useI18n()
  loadTariffs()

  const plans = computed(() => {
    const copy = tm('pricing.plans')

    if (!tariffs.value) {
      return copy.map((plan) => ({
        ...plan,
        tokens: Number(plan.tokens) || 0,
        // The backend's code for a pack is `coins<N>` — the same key the bot's
        // `pay_coins<N>` link uses. A wrong guess comes back as a 404 from the
        // checkout, which the modal reports.
        code: `coins${Number(plan.tokens) || 0}`,
      }))
    }

    return [...tariffs.value]
      .sort((a, b) => a.coins - b.coins)
      .map((tariff) => {
        const plan = copy.find((item) => Number(item.tokens) === tariff.coins)
        const count = Math.floor(tariff.coins / TEST_TOKEN_COST)
        return {
          ...plan,
          name: plan?.name || tariff.name,
          features: plan?.features || [t('pricing.tariffFeature', { count }, count)],
          price: formatSom(tariff.price),
          tokens: tariff.coins,
          code: tariff.code,
        }
      })
  })

  return { plans }
}
