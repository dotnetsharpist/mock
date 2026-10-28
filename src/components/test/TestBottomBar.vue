<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  answeredCount: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    default: 0,
  },
  answeredLabel: {
    type: String,
    default: '',
  },
  submitLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['submit'])

const { t } = useI18n()
</script>

<template>
  <!-- Reads as the question card's own footer: same width and side borders as
       the card, hairline divider on top, flush to the viewport bottom. The
       fixed heights below are what TestPage's bottom padding reserves, so the
       card ends exactly where this bar starts (no page-background gap). -->
  <div class="fixed bottom-0 left-1/2 z-30 flex h-[116px] w-[calc(100%-1.5rem)] max-w-[920px] -translate-x-1/2 items-center border-x border-t border-[#e0ddd7] bg-white sm:h-[76px] sm:w-[calc(100%-2.5rem)] lg:w-[calc(100%-3rem)]">
    <div class="flex w-full flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-10 lg:px-16">
      <div class="flex items-center gap-2.5">
        <button
          type="button"
          :aria-label="t('testFlow.questionList')"
          class="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#e0ddd7] bg-white text-[#1a1814] transition hover:bg-[#1a1814] hover:text-white"
        >
          <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="4" y1="7" x2="20" y2="7" stroke-linecap="round" />
            <line x1="4" y1="12" x2="20" y2="12" stroke-linecap="round" />
            <line x1="4" y1="17" x2="20" y2="17" stroke-linecap="round" />
          </svg>
        </button>

        <p class="font-mono-custom text-[11px] font-normal uppercase tracking-[0.18em] text-[#8a857c] sm:text-sm">
          {{ answeredCount }} / {{ totalQuestions }} {{ answeredLabel }}
        </p>
      </div>

      <button
        type="button"
        @click="$emit('submit')"
        class="font-mono-custom w-full rounded-[18px] bg-[#1a1814] px-6 py-3.5 text-[12px] font-medium uppercase tracking-[0.22em] text-white transition hover:bg-black sm:w-auto sm:rounded-[10px] sm:px-8 sm:py-3 sm:text-sm sm:tracking-[0.18em]"
      >
        {{ submitLabel }}
      </button>
    </div>
  </div>
</template>
