<script setup>
// A full-width strip that sells tanga between a page's sections, on the
// landing's pastel light (.app-iris) with black type and the glossy ink button,
// the same card the landing and Narxlar use for what is worth noticing.
// The button opens the shared pack picker, so the sale happens in place.
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'
import { useBalanceStore } from '@/stores/balance'
import { useTangaOffer } from '@/composables/useTangaOffer'
import { TEST_TOKEN_COST } from '@/utils/premium'

defineProps({
  // One line — coin, title, price, button — for a phone, where the full strip
  // took half a screen.
  compact: { type: Boolean, default: false },
})

const { t, tm, rt } = useI18n()
const balanceStore = useBalanceStore()
const { openOffer } = useTangaOffer()

const buy = () => openOffer(TEST_TOKEN_COST - balanceStore.available)
</script>

<template>
  <section
    v-if="compact"
    class="app-iris flex items-center gap-3 rounded-2xl p-3.5 text-app-ink"
    :aria-label="t('appShell.banner.title')"
  >
    <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 ring-1 ring-white backdrop-blur-sm">
      <CoinIcon :size="20" class="text-app-ink" />
    </span>
    <div class="min-w-0 flex-1">
      <p class="text-[14px] font-medium leading-[1.25] tracking-[-0.01em]">
        {{ t('appShell.banner.titleShort') }}
      </p>
      <p class="mt-0.5 text-[12px]">
        {{ t('appShell.banner.price', { cost: t('common.tangaCount', TEST_TOKEN_COST) }) }}
      </p>
    </div>
    <button
      type="button"
      class="app-btn-ink inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
      @click="buy"
    >
      {{ t('appShell.banner.action') }}
      <AppIcon name="arrowRight" :size="14" />
    </button>
  </section>

  <section
    v-else
    class="app-iris flex flex-col gap-4 rounded-[28px] p-5 text-app-ink sm:px-7 sm:py-6 lg:flex-row lg:items-center lg:gap-6"
    :aria-label="t('appShell.banner.title')"
  >
    <div class="flex min-w-0 flex-1 items-start gap-4">
      <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 ring-1 ring-white backdrop-blur-sm">
        <CoinIcon :size="22" class="text-app-ink" />
      </span>

      <div class="min-w-0">
        <h2 class="text-[20px] font-normal leading-[1.15] tracking-[-0.025em] sm:text-[26px]">
          {{ t('appShell.banner.title') }}
        </h2>
        <ul class="mt-3 flex flex-wrap gap-2">
          <li
            v-for="(point, index) in tm('appShell.banner.points')"
            :key="index"
            class="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-[12.5px] font-medium backdrop-blur-sm"
          >
            <AppIcon name="check" :size="13" class="shrink-0" />
            {{ rt(point) }}
          </li>
        </ul>
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-between gap-4 border-t border-app-ink/10 pt-4 lg:justify-end lg:border-0 lg:pt-0">
      <p class="flex items-center gap-1.5 text-[13px] font-medium">
        <CoinIcon :size="14" class="text-app-ink" />
        {{ t('appShell.banner.price', { cost: t('common.tangaCount', TEST_TOKEN_COST) }) }}
      </p>
      <button
        type="button"
        class="app-btn-ink inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-medium transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
        @click="buy"
      >
        {{ t('appShell.banner.action') }}
        <AppIcon name="arrowRight" :size="15" />
      </button>
    </div>
  </section>
</template>
