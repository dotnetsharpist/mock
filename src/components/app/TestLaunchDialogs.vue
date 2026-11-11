<script setup>
// The three confirmations that can stand between a row's action button and the
// test itself: start, buy, top up. One component so every platform screen that
// lists tests asks the same questions in the same words.
//
// Built from the platform's own parts — card surface, ink pill, hairline
// border — rather than the naive-ui modal the public pages use, so it belongs
// to this design system (docs/DESIGN.md).
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import CoinIcon from './CoinIcon.vue'

const props = defineProps({
  // '' | 'start' | 'purchase' | 'topup'
  mode: { type: String, default: '' },
  test: { type: Object, default: null },
  cost: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['confirm', 'close', 'topup'])

const { t, tm, rt } = useI18n()

// What a premium test gives, shown on the buy and top-up steps.
const premiumPoints = computed(() => tm('appShell.banner.points').map((point) => rt(point)))

const isOpen = computed(() => Boolean(props.mode && props.test))

const copy = computed(() => {
  if (props.mode === 'purchase') {
    return {
      icon: 'coins',
      title: t('testLaunch.premiumTitle'),
      confirmLabel: props.busy ? t('testLaunch.buying') : t('pricing.buy'),
    }
  }
  if (props.mode === 'topup') {
    return {
      icon: 'coins',
      title: t('testLaunch.notEnoughTitle'),
      confirmLabel: t('appShell.topbar.topUp'),
    }
  }
  return {
    icon: 'tests',
    // Re-taking is a different decision from taking it the first time — say so,
    // so a student does not restart a finished test by accident.
    title:
      props.test?.state === 'done' ? t('testLaunch.restartTitle') : t('testLaunch.startTitle'),
    confirmLabel: props.busy ? t('appUi.opening') : t('testLaunch.start'),
  }
})

// "40 savol, 180 daqiqa" — the duration only when the test has one. Each count
// is its own message so Russian can agree both nouns with their numbers.
const startDetails = computed(() => {
  if (!props.test) return ''
  const parts = [t('appUi.questionCount', props.test.questionCount)]
  if (props.test.durationMinutes) {
    parts.push(t('testLaunch.minutes', props.test.durationMinutes))
  }
  return parts.join(', ')
})
</script>

<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="emit('close')"></div>

      <div
        class="relative w-full max-w-[420px] rounded-[28px] bg-app-surface p-6 text-center shadow-app-card"
        role="dialog"
        aria-modal="true"
        :aria-label="copy.title"
      >
        <span
          class="app-iris mx-auto flex h-14 w-14 items-center justify-center rounded-full text-app-ink ring-4 ring-white shadow-app-card"
        >
          <AppIcon :name="copy.icon" :size="22" />
        </span>

        <h2 class="mt-4 text-[20px] font-medium leading-tight tracking-[-0.02em] text-app-ink">
          {{ copy.title }}
        </h2>

        <p class="mt-2 text-[14px] leading-[1.6] text-app-ink">
          <template v-if="mode === 'start'">
            {{ t('testLaunch.summary', { title: test.title, details: startDetails }) }}
            {{ test.state === 'done' ? t('testLaunch.retakeNote') : t('testLaunch.timerNote') }}
          </template>
          <i18n-t
            v-else
            :keypath="mode === 'purchase' ? 'testLaunch.purchaseBody' : 'testLaunch.topUpBody'"
            tag="span"
            scope="global"
          >
            <template #title>{{ test.title }}</template>
            <template #cost>
              <span class="font-semibold text-app-ink">{{ t('common.tangaCount', cost) }}</span>
            </template>
          </i18n-t>
        </p>

        <template v-if="mode !== 'start'">
          <p class="mt-1 text-[13px] text-app-ink">{{ startDetails }}</p>
          <ul class="mx-auto mt-4 max-w-[300px] space-y-1.5 text-left">
            <li
              v-for="point in premiumPoints"
              :key="point"
              class="flex items-center gap-2 text-[14px] text-app-ink"
            >
              <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-ink text-white">
                <AppIcon name="check" :size="12" />
              </span>
              {{ point }}
            </li>
          </ul>
        </template>

        <p
          v-if="mode !== 'start'"
          class="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#d6ecee] px-3.5 py-1.5 text-[13px] font-medium text-app-ink"
        >
          {{ t('testLaunch.balance') }}
          <CoinIcon :size="14" class="text-app-ink" />
          <span class="font-semibold text-app-ink">{{ t('common.tangaCount', balance) }}</span>
        </p>

        <p v-if="error" class="mt-3 text-[13px] text-app-bad">{{ error }}</p>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            :disabled="busy"
            class="rounded-full bg-app-tile px-5 py-2.5 text-[14px] font-medium text-app-ink transition-colors hover:bg-app-warm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="busy"
            class="rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-medium text-white transition-transform hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit(mode === 'topup' ? 'topup' : 'confirm')"
          >
            {{ copy.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
