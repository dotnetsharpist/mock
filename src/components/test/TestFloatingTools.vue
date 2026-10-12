<script setup>
import { computed } from 'vue'
import { formatCountdown } from '@/utils/formatCountdown'

const props = defineProps({
  remainingSeconds: {
    type: Number,
    default: 0,
  },
  // The pause button sits in the pill (the real test page only — the demo
  // pages have no attempt to pause). It goes quiet while a pause/unpause is on
  // the wire or the test is being finished.
  pausable: {
    type: Boolean,
    default: false,
  },
  pauseDisabled: {
    type: Boolean,
    default: false,
  },
  pauseLabel: {
    type: String,
    default: '',
  },
})

defineEmits(['pause'])

const formattedTime = computed(() => formatCountdown(props.remainingSeconds))
</script>

<template>
  <div class="fixed right-3 top-3 z-30 sm:right-6 sm:top-6">
    <div
      class="floating-timer flex items-center gap-2 rounded-full border border-white/10 bg-black/92 px-3 py-2 text-white shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-md sm:gap-3 sm:px-4 sm:py-3"
      :class="pausable ? '!pr-2 sm:!pr-3' : ''"
    >
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 sm:h-11 sm:w-11"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          class="h-4 w-4 sm:h-5 sm:w-5"
          stroke="currentColor"
          stroke-width="2"
        >
          <circle cx="12" cy="12" r="9" />
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 7v5l3 3"
          />
        </svg>
      </div>

      <span class="countdown-text">
        {{ formattedTime }}
      </span>

      <button
        v-if="pausable"
        type="button"
        :disabled="pauseDisabled"
        :aria-label="pauseLabel"
        :title="pauseLabel"
        class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
        @click="$emit('pause')"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true">
          <rect x="6" y="5" width="4" height="14" rx="1" />
          <rect x="14" y="5" width="4" height="14" rx="1" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.countdown-text {
  font-size: 18px;
  line-height: 1;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.floating-timer {
  min-width: 118px;
}

@media (min-width: 640px) {
  .countdown-text {
    font-size: 26px;
    letter-spacing: 0.08em;
  }

  .floating-timer {
    min-width: 170px;
  }
}
</style>
