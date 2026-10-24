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

const { t } = useI18n()

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
      <div class="absolute inset-0 bg-black/40" @click="emit('close')"></div>

      <div
        class="relative w-full max-w-[420px] rounded-2xl border border-app-border bg-app-surface p-6 text-center shadow-app-card"
        role="dialog"
        aria-modal="true"
        :aria-label="copy.title"
      >
        <span
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-app-tile text-app-ink"
        >
          <AppIcon :name="copy.icon" :size="22" />
        </span>

        <h2 class="mt-4 text-[18px] font-bold tracking-[-0.015em] text-app-ink">
          {{ copy.title }}
        </h2>

        <p class="mt-2 text-[14px] leading-[1.6] text-app-muted">
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

        <p
          v-if="mode !== 'start'"
          class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-app-sunken px-3 py-1.5 text-[13px] text-app-muted"
        >
          {{ t('testLaunch.balance') }}
          <CoinIcon :size="14" class="text-app-coin" />
          <span class="font-semibold text-app-ink">{{ t('common.tangaCount', balance) }}</span>
        </p>

        <p v-if="error" class="mt-3 text-[13px] text-app-bad">{{ error }}</p>

        <div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            :disabled="busy"
            class="rounded-full border border-app-border bg-app-surface px-5 py-2.5 text-[14px] font-semibold text-app-ink transition-colors hover:bg-app-tile focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit('close')"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            :disabled="busy"
            class="rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-semibold text-app-surface transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink disabled:opacity-60"
            @click="emit(mode === 'topup' ? 'topup' : 'confirm')"
          >
            {{ copy.confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
