<script setup>
// The question map of a session: one square per question, marked by where the
// student stands on it. Opens above the footer; picking a number jumps there.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AppIcon from '@/components/app/AppIcon.vue'

const { t } = useI18n()

const props = defineProps({
  // [{ id, state: 'correct' | 'wrong' | 'answered' | 'none' }], in session order
  items: { type: Array, required: true },
  currentIndex: { type: Number, default: 0 },
  // A timed run keeps right/wrong hidden until it is finished.
  showResults: { type: Boolean, default: true },
})

const emit = defineEmits(['go', 'close'])

const onKeydown = (event) => {
  if (event.key === 'Escape') emit('close')
}

// Focus lands on the current question's square and goes back to the toggle
// when the map closes, so a keyboard user is never left behind the overlay.
const grid = ref(null)
let returnFocus = null
onMounted(async () => {
  returnFocus = document.activeElement
  window.addEventListener('keydown', onKeydown)
  await nextTick()
  grid.value?.children[props.currentIndex]?.focus()
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus()
})

const cellClass = (state, showResults) => {
  if (showResults && state === 'correct') return 'border-app-good bg-app-good-bg text-app-good'
  if (showResults && state === 'wrong') return 'border-app-bad bg-app-bad-bg text-app-bad'
  if (state !== 'none') return 'border-app-ink bg-app-ink text-app-surface'
  return 'border-app-border bg-app-surface text-app-ink hover:bg-app-tile'
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[250]" @click="emit('close')"></div>
    <div
      class="fixed inset-x-3 bottom-[84px] z-[260] mx-auto max-w-[460px] rounded-2xl border border-app-border bg-app-surface p-4 shadow-[0_18px_40px_rgba(10,10,10,0.14)] sm:p-5"
      role="dialog"
      :aria-label="t('bank.palette.label')"
    >
      <div class="flex items-center justify-between">
        <p class="text-[15px] font-bold text-app-ink">{{ t('bank.labels.questions') }}</p>
        <button
          type="button"
          class="flex h-8 w-8 items-center justify-center rounded-full text-app-muted hover:bg-app-tile hover:text-app-ink"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <AppIcon name="close" :size="16" />
        </button>
      </div>

      <!-- p-1.5: the current question's ring sits 4px outside its cell, and a
           scrolling box clips anything past its padding. -->
      <div ref="grid" class="-mx-1.5 mt-2 grid max-h-[46vh] grid-cols-6 gap-2 overflow-y-auto p-1.5 sm:grid-cols-8">
        <button
          v-for="(item, index) in items"
          :key="item.id"
          type="button"
          class="flex h-10 items-center justify-center rounded-lg border text-[13px] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-ink"
          :class="[cellClass(item.state, showResults), index === currentIndex ? 'ring-2 ring-app-ink ring-offset-2' : '']"
          :aria-current="index === currentIndex ? 'step' : undefined"
          @click="emit('go', index)"
        >
          {{ index + 1 }}
        </button>
      </div>

      <div class="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-app-muted">
        <template v-if="showResults">
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-app-good bg-app-good-bg"></span>{{ t('bank.labels.correct') }}</span>
          <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-app-bad bg-app-bad-bg"></span>{{ t('bank.labels.wrong') }}</span>
        </template>
        <span v-else class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded bg-app-ink"></span>{{ t('bank.labels.answered') }}</span>
        <span class="inline-flex items-center gap-1.5"><span class="h-3 w-3 rounded border border-app-border"></span>{{ t('bank.labels.unanswered') }}</span>
      </div>
    </div>
  </Teleport>
</template>
