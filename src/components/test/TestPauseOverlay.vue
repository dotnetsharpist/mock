<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import logoMarkDark from '@/assets/logo-mark.png'
import { formatCountdown } from '@/utils/formatCountdown'

// Full-screen cover while the attempt is paused. The server has frozen the
// clock and rejects answer saves, so the questions stay hidden behind this
// until the student continues (POST /user-test-attempt/unpause).
const props = defineProps({
  // The frozen time left; null for an untimed test (no time shown).
  remainingSeconds: { type: Number, default: null },
  busy: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
})

defineEmits(['resume'])

const { t } = useI18n()

const hasTime = computed(() => props.remainingSeconds !== null)
const formattedTime = computed(() => formatCountdown(props.remainingSeconds))
</script>

<template>
  <Teleport to="body">
    <div
      class="font-sans-custom fixed inset-0 z-[60] flex flex-col items-center justify-center overflow-y-auto bg-[#f5f3ef] px-6 text-[#1a1814]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-pause-title"
    >
      <!-- A way out: the clock is frozen and TestPage doesn't guard a paused
           attempt, so leaving is safe — the dashboard's banner brings it back. -->
      <RouterLink
        to="/dashboard"
        class="absolute left-5 top-5 flex items-center gap-2.5 rounded-md transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1a1814] sm:left-8 sm:top-7"
      >
        <img :src="logoMarkDark" alt="" class="h-7 w-auto object-contain" />
        <span class="text-[15px] font-bold tracking-[-0.025em]">MilliyMock</span>
      </RouterLink>

      <div
        class="mb-8 flex h-[104px] w-[104px] items-center justify-center rounded-full border border-[#e0ddd7] bg-white shadow-[0_10px_30px_rgba(26,24,20,0.07)]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="h-9 w-9">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      </div>

      <h2
        id="test-pause-title"
        class="text-center text-[clamp(24px,5vw,34px)] font-extrabold tracking-[-0.02em]"
      >
        {{ t('testPage.pause.title') }}
      </h2>
      <p class="mt-3 max-w-[380px] text-center text-[14px] leading-relaxed text-[#6b6760]">
        {{ t('testPage.pause.description') }}
      </p>

      <div v-if="hasTime" class="mt-7 text-center">
        <p class="font-mono-custom text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a857c]">
          {{ t('testPage.pause.timeLeft') }}
        </p>
        <p class="frozen-time mt-2 text-[32px] font-semibold text-[#1a1814] sm:text-[40px]">
          {{ formattedTime }}
        </p>
      </div>

      <p
        v-if="errorMessage"
        class="mt-5 max-w-[380px] text-center text-[13.5px] font-medium text-red-600"
        role="alert"
      >
        {{ errorMessage }}
      </p>

      <button
        type="button"
        :disabled="busy"
        class="font-mono-custom mt-8 inline-flex h-12 min-w-[220px] items-center justify-center rounded-full bg-[#1a1814] px-8 text-[12px] font-medium uppercase tracking-[0.2em] text-white transition hover:bg-black active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        @click="$emit('resume')"
      >
        {{ busy ? t('testPage.pause.resuming') : t('testPage.pause.resume') }}
      </button>

      <p class="absolute bottom-6 px-6 text-center text-xs text-[#8a857c]">
        {{ t('testPage.pause.expiryHint') }}
      </p>
    </div>
  </Teleport>
</template>

<style scoped>
.frozen-time {
  line-height: 1;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
