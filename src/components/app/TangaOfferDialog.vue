<script setup>
// The pack picker behind useTangaOffer(): pick a pack here, pay in
// PricingPaymentModal, and the student is still on the screen they started
// from. Same surface as TestLaunchDialogs so it reads as part of the platform.
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import PricingPaymentModal from '@/components/PricingPaymentModal.vue'
import { useBalanceStore } from '@/stores/balance'
import { usePricingPlans } from '@/composables/usePricingPlans'
import { useTangaOffer } from '@/composables/useTangaOffer'
import { TEST_TOKEN_COST } from '@/utils/premium'

const { t } = useI18n()
const balanceStore = useBalanceStore()
const { plans } = usePricingPlans()
const { isOpen, needed, closeOffer } = useTangaOffer()

const selectedPlan = ref(null)
const isPaymentOpen = ref(false)

// Sorted cheapest first, so "the smallest pack that covers it" is the first fit.
const packs = computed(() => [...plans.value].sort((a, b) => Number(a.tokens) - Number(b.tokens)))

// The pack to point at: the smallest that covers the shortfall, else the
// popular one, else the first.
const suggested = computed(() => {
  const list = packs.value
  if (needed.value) {
    const fit = list.find((plan) => Number(plan.tokens) >= needed.value)
    if (fit) return fit
  }
  return list.find((plan) => plan.highlighted) || list[0] || null
})

const buy = (plan) => {
  selectedPlan.value = plan
  closeOffer()
  isPaymentOpen.value = true
}

// Escape closes, as every other dialog here does.
watch(isOpen, (open, _, onCleanup) => {
  if (!open) return
  const onKey = (event) => event.key === 'Escape' && closeOffer()
  window.addEventListener('keydown', onKey)
  onCleanup(() => window.removeEventListener('keydown', onKey))
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="closeOffer"></div>

      <div
        class="relative w-full max-w-[440px] rounded-[28px] bg-app-surface p-6 shadow-app-card"
        role="dialog"
        aria-modal="true"
        :aria-label="t('appShell.offer.title')"
      >
        <button
          type="button"
          class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors hover:bg-app-warm"
          :aria-label="t('common.close')"
          @click="closeOffer"
        >
          <AppIcon name="close" :size="18" />
        </button>

        <div class="text-center">
          <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-tile text-app-ink">
            <AppIcon name="coins" :size="22" />
          </span>
          <h2 class="mt-4 text-[20px] font-medium leading-tight tracking-[-0.02em] text-app-ink">
            {{ t('appShell.offer.title') }}
          </h2>
          <p class="mt-2 text-[14px] leading-[1.6] text-app-ink">
            {{ t('appShell.offer.lead', { cost: t('common.tangaCount', TEST_TOKEN_COST) }) }}
          </p>
          <p
            class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-app-tile px-3.5 py-1.5 text-[13px] text-app-ink"
          >
            <CoinIcon :size="14" class="text-app-ink" />
            <span class="font-semibold">{{ t('common.tangaCount', balanceStore.available) }}</span>
            <template v-if="needed">
              · {{ t('appShell.offer.needed', { n: t('common.tangaCount', needed) }) }}
            </template>
          </p>
        </div>

        <ul class="mt-5 space-y-2">
          <li v-for="plan in packs" :key="plan.code || plan.tokens">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition-[background-color,transform] hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
              :class="plan === suggested ? 'app-iris' : 'bg-app-tile hover:bg-app-warm'"
              @click="buy(plan)"
            >
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/70 ring-1 ring-white">
                <CoinIcon :size="18" class="text-app-ink" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-[15px] font-semibold text-app-ink">
                  {{ t('common.tangaCount', Number(plan.tokens)) }}
                </span>
                <span class="block text-[13px] text-app-ink">{{ plan.price }}</span>
              </span>
              <span
                v-if="plan === suggested"
                class="shrink-0 rounded-full bg-app-ink px-2.5 py-1 text-[11px] font-medium text-white"
              >
                {{ needed ? t('appShell.offer.fits') : t('pricing.popular') }}
              </span>
              <span v-else class="shrink-0 text-[13px] font-semibold text-app-ink">
                {{ t('appShell.offer.buy') }}
              </span>
            </button>
          </li>
        </ul>

        <RouterLink
          to="/tanga"
          class="mt-4 flex items-center justify-center gap-1.5 text-[13px] font-medium text-app-ink underline-offset-4 hover:underline"
          @click="closeOffer"
        >
          {{ t('appShell.offer.allPlans') }}
          <AppIcon name="arrowRight" :size="14" />
        </RouterLink>
      </div>
    </div>
  </Teleport>

  <PricingPaymentModal :open="isPaymentOpen" :plan="selectedPlan" @close="isPaymentOpen = false" />
</template>
