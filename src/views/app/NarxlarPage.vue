<script setup>
// Narxlar — buying tanga, from inside the platform.
//
// Two real things, no invented ones:
//   • the plans, from the same source the public pricing page reads
//     (usePricingPlans: the backend's tariffs, worded by i18n), so a price
//     cannot be right in one place and stale in the other
//   • the balance, which lives in the top bar on every screen — this page does
//     not repeat it
//
// Buying reuses PricingPaymentModal — Click / Payme (PAYMENT_PROVIDERS), or a
// card through @milliymock_bot — so the flow can't drift from the public page.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import CoinIcon from '@/components/app/CoinIcon.vue'
import PricingPaymentModal from '@/components/PricingPaymentModal.vue'
import { useBalanceStore } from '@/stores/balance'
import { usePricingPlans } from '@/composables/usePricingPlans'
import { formatProviders, WORKING_PAYMENT_PROVIDERS } from '@/utils/payment'
import { intlLocale } from '@/i18n'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const { t } = useI18n()
const balanceStore = useBalanceStore()

const { plans: rawPlans } = usePricingPlans()
const billingNoteKey = WORKING_PAYMENT_PROVIDERS.length ? 'pricing.billingNoteOnline' : 'pricing.billingNote'

// The cheapest plan is the yardstick the others are measured against.
const basePlan = computed(() =>
  [...rawPlans.value].sort((a, b) => Number(a.tokens) - Number(b.tokens))[0] || null,
)

const plans = computed(() =>
  rawPlans.value.map((plan, index) => {
    const tokens = Number(plan.tokens) || 0
    const baseTokens = Number(basePlan.value?.tokens) || 0
    // How many times more tanga than the entry plan. The design's chip reads
    // "better value", but 10 tanga for 35 000 against 5 for 20 000 is 2× the
    // tanga at 1.75× the price — better value, though not by 2×. So the chip
    // states the thing that is actually 2×: the tanga.
    const ratio = baseTokens && tokens > baseTokens ? Number((tokens / baseTokens).toFixed(1)) : null
    return {
      ...plan,
      index,
      tokens,
      // "2x ko‘proq tanga" / "в 2 раза больше токенов" — a fractional ratio
      // takes the "few" form in Russian (в 2,5 раза).
      ratio: ratio
        ? t(
            'paymentApp.pricing.ratio',
            { ratio: `${ratio}x`, times: ratio.toLocaleString(intlLocale()) },
            Number.isInteger(ratio) ? ratio : 2,
          )
        : null,
      // No badge on the plain pack — "Basic" was an English filler word next to
      // two Uzbek ones, and it labelled a pack that has nothing less in it.
      badge: plan.highlighted
        ? { label: t('pricing.popular'), solid: true }
        : plan.bestValue
          ? { label: t('pricing.bestValue'), solid: false }
          : null,
    }
  }),
)

// "35 000 so'm" → the figure big, the currency small, as the reference sets
// "$499" against ".00 /Month". By size, not by grey.
const splitPrice = (price) => {
  const text = String(price || '')
  const cut = text.search(/\s[^\d\s]+.*$/)
  return cut > 0 ? { amount: text.slice(0, cut), unit: text.slice(cut + 1) } : { amount: text, unit: '' }
}

const selectedPlan = ref(null)
const isPaymentOpen = ref(false)

const buy = (plan) => {
  selectedPlan.value = plan
  isPaymentOpen.value = true
}

onMounted(() => {
  balanceStore.refresh().catch(() => {})
})

// The three rules that govern tanga, stated once where they are being sold.
// Tanga buy two things — a premium test and an AI essay check — and both cost
// the same (TEST_TOKEN_COST; the essay price is the backend's, mirrored here).
// The first essay check is free (backend FreeReviewCount = 1).
// Worded at render from `paymentApp.pricing.how.<key>` (title, description).
const HOW_IT_WORKS = [
  { key: 'cost', numeral: '2' },
  { key: 'expiry', icon: 'infinity' },
  { key: 'charge', icon: 'play' },
]
</script>

<template>
  <AppTopbar
    :title="t('paymentApp.pricing.title')"
    :subtitle="t('paymentApp.pricing.subtitle')"
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <!-- In the landing's language: a centred heading, the packs on one soft grey
       tray with the popular one lifted out in white, then a pastel card for the
       undecided. -->
  <main class="mx-auto max-w-[1080px] pb-6">
    <header class="mx-auto max-w-[620px] pb-8 pt-4 text-center sm:pt-8">
      <h2 class="text-[30px] font-normal leading-[1.1] tracking-[-0.025em] text-app-ink sm:text-[44px]">
        {{ t('paymentApp.pricing.heroTitle') }}
      </h2>
      <p class="mt-3 text-[15px] leading-[1.6] text-app-ink sm:text-[16px]">
        {{ t('paymentApp.pricing.packsLead') }}
      </p>
    </header>

    <!-- Plans -->
    <section aria-labelledby="plans-heading">
      <h3 id="plans-heading" class="sr-only">{{ t('paymentApp.pricing.plansHeading') }}</h3>
      <div class="grid grid-cols-1 gap-2 rounded-[32px] bg-[#e9e9e9] p-2 md:grid-cols-3">
        <article
          v-for="plan in plans"
          :key="plan.index"
          class="flex h-full flex-col rounded-[26px] p-6 sm:p-7"
          :class="plan.highlighted ? 'bg-app-surface shadow-app-card' : 'bg-transparent'"
        >
          <div class="flex items-start justify-between gap-3">
            <!-- The popular pack's mark is the landing's pastel light; the
                 others are the plain black tile. -->
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl"
              :class="plan.highlighted ? 'app-iris shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)]' : 'bg-app-surface ring-1 ring-app-border'"
              aria-hidden="true"
            >
              <CoinIcon :size="18" class="text-app-ink" />
            </span>
            <span
              v-if="plan.badge"
              class="inline-flex items-center gap-1.5 rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-[12px] font-medium text-app-ink shadow-[0_1px_3px_rgba(17,17,17,0.08)]"
            >
              <AppIcon :name="plan.badge.solid ? 'flame' : 'checkCircle'" :size="13" />
              {{ plan.badge.label }}
            </span>
          </div>

          <h4 class="mt-5 text-[18px] font-medium tracking-[-0.015em] text-app-ink">{{ plan.name }}</h4>
          <p v-if="plan.features?.[1]" class="mt-1 text-[13px] text-app-ink">{{ plan.features[1] }}</p>

          <p class="mt-6 flex items-baseline gap-1.5 text-app-ink">
            <span class="text-[40px] font-normal leading-none tracking-[-0.035em] tabular-nums sm:text-[44px]">
              {{ splitPrice(plan.price).amount }}
            </span>
            <span class="text-[14px]">{{ splitPrice(plan.price).unit }}</span>
          </p>

          <div class="my-6 h-px bg-app-ink/10"></div>

          <p class="text-[13px] font-medium text-app-ink">{{ t('paymentApp.pricing.included') }}</p>
          <ul class="mb-8 mt-3 space-y-2.5">
            <li class="flex items-center gap-2.5 text-[14px] text-app-ink">
              <AppIcon name="check" :size="15" class="shrink-0" />
              {{ t('common.tangaCount', plan.tokens) }}
            </li>
            <li v-if="plan.features?.[0]" class="flex items-center gap-2.5 text-[14px] text-app-ink">
              <AppIcon name="check" :size="15" class="shrink-0" />
              {{ plan.features[0] }}
            </li>
            <li v-if="plan.ratio" class="flex items-center gap-2.5 text-[14px] text-app-ink">
              <AppIcon name="check" :size="15" class="shrink-0" />
              {{ plan.ratio }}
            </li>
            <li class="flex items-center gap-2.5 text-[14px] text-app-ink">
              <AppIcon name="check" :size="15" class="shrink-0" />
              {{ t('paymentApp.pricing.forever') }}
            </li>
          </ul>

          <!-- mt-auto keeps the three buttons on one baseline. -->
          <button
            type="button"
            class="app-btn-ink mt-auto w-full rounded-full px-5 py-3.5 text-[14px] font-medium transition-transform duration-200 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink motion-reduce:hover:scale-100"
            @click="buy(plan)"
          >
            {{ t('paymentApp.buyTokens', plan.tokens) }}
          </button>
        </article>
      </div>
    </section>

    <!-- How tanga works, on the landing's pastel card: the three rules as
         frosted tiles, then how payment lands. -->
    <section
      id="tanga-qanday-ishlaydi"
      class="app-iris mt-2 rounded-[32px] px-5 py-10 sm:px-8 sm:py-12"
      aria-labelledby="how-heading"
    >
      <h3 id="how-heading" class="text-center text-[24px] font-normal tracking-[-0.025em] text-app-ink sm:text-[32px]">
        {{ t('paymentApp.pricing.howTitle') }}
      </h3>

      <dl class="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          v-for="item in HOW_IT_WORKS"
          :key="item.key"
          class="rounded-[24px] bg-white/70 p-6 ring-1 ring-white backdrop-blur-sm"
        >
          <span
            class="flex h-10 w-10 items-center justify-center rounded-xl bg-app-surface text-app-ink"
            aria-hidden="true"
          >
            <AppIcon v-if="item.icon" :name="item.icon" :size="18" />
            <span v-else class="text-[15px] font-medium">{{ item.numeral }}</span>
          </span>
          <dt class="mt-5 text-[16px] font-medium tracking-[-0.01em] text-app-ink">
            {{ t(`paymentApp.pricing.how.${item.key}.title`) }}
          </dt>
          <dd class="mt-1.5 text-[13.5px] leading-[1.6] text-app-ink">
            {{ t(`paymentApp.pricing.how.${item.key}.description`) }}
          </dd>
        </div>
      </dl>

      <p class="mx-auto mt-6 max-w-[640px] text-center text-[13px] leading-[1.6] text-app-ink">
        {{ t(billingNoteKey, { providers: formatProviders() }) }}.
      </p>
    </section>

    <!-- The live payment flow, reused as-is -->
    <PricingPaymentModal
      :open="isPaymentOpen"
      :plan="selectedPlan"
      @close="isPaymentOpen = false"
    />
  </main>
</template>
