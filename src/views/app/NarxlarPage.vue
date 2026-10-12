<script setup>
// Narxlar — buying tanga, from inside the platform.
//
// Two real things, no invented ones:
//   • the plans, from the same i18n source the public pricing page reads, so
//     a price cannot be right in one place and stale in the other
//   • the balance, which lives in the top bar on every screen — this page does
//     not repeat it
//
// Buying reuses PricingPaymentModal — the hand-off into @milliymock_bot, where
// the payment itself happens — so the flow can't drift from the public page.
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppTopbar from '@/components/app/AppTopbar.vue'
import AppCard from '@/components/app/AppCard.vue'
import AppIcon from '@/components/app/AppIcon.vue'
import CoinIcon from '@/components/app/CoinIcon.vue'
import PricingPaymentModal from '@/components/PricingPaymentModal.vue'
import { useBalanceStore } from '@/stores/balance'

defineProps({
  user: { type: Object, required: true },
})
defineEmits(['openMenu'])

const { t, tm } = useI18n()
const balanceStore = useBalanceStore()

const rawPlans = computed(() => tm('pricing.plans'))

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
    const ratio = baseTokens && tokens > baseTokens ? tokens / baseTokens : null
    return {
      ...plan,
      index,
      tokens,
      ratio: ratio ? `${Number(ratio.toFixed(1))}x` : null,
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
const HOW_IT_WORKS = [
  {
    key: 'cost',
    numeral: '2',
    title: '2 tanga = 1 test yoki 1 insho tekshiruvi',
    description:
      'Premium test ham, AI insho tekshiruvi ham 2 tangadan. Birinchi insho tekshiruvi bepul.',
  },
  {
    key: 'expiry',
    icon: 'infinity',
    title: 'Tanga muddatsiz amal qiladi',
    description: 'Obuna emas — tangalar sarflanmaguncha hisobingizda turadi.',
  },
  {
    key: 'charge',
    icon: 'play',
    title: 'Faqat ishlatganda yechiladi',
    description: 'Tanga testni boshlaganingizda yoki inshoni tekshiruvga yuborganingizda yechiladi.',
  },
]
</script>

<template>
  <AppTopbar
    title="Narxlar"
    subtitle="Tanga sotib oling — premium testlar va AI insho tekshiruvi uchun."
    :user="user"
    @open-menu="$emit('openMenu')"
  />

  <main>
    <!-- One card holds the whole offer: the packages and the rules that govern
         them. Splitting them into two surfaces made the rules read as an
         unrelated footnote rather than part of what is being bought. -->
    <!-- Below sm the outer surface drops away — the same rule Testlar follows.
         Two nested borders cost ~40px of a 390px screen, and the plan cards
         already group themselves. -->
    <AppCard
      class="max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none"
    >
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 class="text-[18px] font-bold tracking-[-0.015em] text-app-ink">Tanga paketlari</h2>
          <!-- Same rule as the topbar subtitle: on a phone this sentence only
               restates the heading above it. -->
          <p class="mt-0.5 hidden text-[13px] text-app-muted sm:block">
            Har bir paket bir xil narsani beradi — faqat hajmi va bittasining narxi farq qiladi.
          </p>
        </div>

        <a
          href="#tanga-qanday-ishlaydi"
          class="inline-flex shrink-0 items-center gap-2 rounded-lg text-[13px] font-medium text-app-muted transition-colors hover:text-app-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        >
          <AppIcon name="info" :size="16" />
          Tanga qanday ishlaydi?
        </a>
      </div>

      <!-- Plans -->
      <section aria-labelledby="plans-heading" class="mt-5">
        <h3 id="plans-heading" class="sr-only">Ta'riflar</h3>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <!-- All three cards share one surface. The popular plan used to get a
               2px ink border, a white fill and a shadow, which made it read as a
               different kind of thing — and the thicker border pushed its
               features and button 1px out of line with its neighbours. The badge
               is enough to mark it. -->
          <article
            v-for="plan in plans"
            :key="plan.index"
            class="flex h-full flex-col rounded-2xl border border-app-border bg-app-sunken p-5 transition-colors max-sm:bg-app-surface"
          >
            <div class="flex items-start justify-between gap-3">
              <h4 class="text-[15px] font-bold tracking-[-0.01em] text-app-ink">
                {{ plan.name }}
              </h4>
              <span
                v-if="plan.badge"
                class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
                :class="
                  plan.badge.solid
                    ? 'bg-app-ink text-app-surface'
                    : 'bg-app-tile text-app-muted'
                "
              >
                {{ plan.badge.label }}
              </span>
            </div>

            <p class="mt-4 text-[26px] font-bold leading-none tracking-[-0.03em] text-app-ink">
              {{ plan.price }}
            </p>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-app-tile px-3 py-1 text-[13px] font-semibold text-app-ink"
              >
                <CoinIcon :size="14" class="text-app-coin" />
                {{ plan.tokens }} {{ t('pricing.tokenSuffix') }}
              </span>
              <span
                v-if="plan.ratio"
                class="inline-flex items-center rounded-full bg-app-tile px-3 py-1 text-[13px] font-medium text-app-muted"
              >
                {{ plan.ratio }} ko‘proq tanga
              </span>
            </div>

            <!-- mb here, not mt on the button: the button uses mt-auto to sit on
                 the card's baseline, and mt-auto would collapse that gap. -->
            <div class="mb-6 mt-5 border-t border-app-border pt-5">
              <ul class="space-y-2.5">
                <li
                  v-for="(feature, fIndex) in plan.features"
                  :key="fIndex"
                  class="flex items-start gap-2.5 text-[13px] leading-[1.55] text-app-ink"
                >
                  <AppIcon name="checkCircle" :size="16" class="mt-0.5 shrink-0 text-app-muted" />
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- mt-auto keeps the three buttons on one baseline when the plans
                 list different numbers of features. -->
            <button
              type="button"
              class="mt-auto w-full rounded-lg bg-app-ink px-4 py-3 text-[13px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              @click="buy(plan)"
            >
              {{ plan.tokens }} {{ t('pricing.tokenSuffix') }} {{ t('pricing.buy').toLowerCase() }}
            </button>
          </article>
        </div>
      </section>

      <!-- How tanga works -->
      <section
        id="tanga-qanday-ishlaydi"
        class="mt-4 rounded-2xl border border-app-border bg-app-sunken p-5 max-sm:bg-app-surface"
        aria-labelledby="how-heading"
      >
        <h3 id="how-heading" class="text-[15px] font-bold tracking-[-0.01em] text-app-ink">
          Tanga qanday ishlaydi?
        </h3>

        <dl class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          <div
            v-for="(item, index) in HOW_IT_WORKS"
            :key="item.key"
            class="flex items-start gap-3"
            :class="index ? 'md:border-l md:border-app-border md:pl-6' : ''"
          >
            <span
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-app-tile text-app-ink"
              aria-hidden="true"
            >
              <AppIcon v-if="item.icon" :name="item.icon" :size="17" />
              <span v-else class="text-[14px] font-bold">{{ item.numeral }}</span>
            </span>
            <div class="min-w-0">
              <dt class="text-[14px] font-semibold text-app-ink">{{ item.title }}</dt>
              <dd class="mt-1 text-[12.5px] leading-[1.6] text-app-muted">
                {{ item.description }}
              </dd>
            </div>
          </div>
        </dl>

        <p class="mt-5 border-t border-app-border pt-4 text-[12.5px] text-app-muted">
          {{ t('pricing.billingNote') }}.
        </p>
      </section>
    </AppCard>

    <!-- The live payment flow, reused as-is -->
    <PricingPaymentModal
      :open="isPaymentOpen"
      :plan="selectedPlan"
      @close="isPaymentOpen = false"
    />
  </main>
</template>
