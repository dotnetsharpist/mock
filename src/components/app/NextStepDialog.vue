<script setup>
// Shown once, right after a student closes the certificate of a FREE test they
// just finished: their score and the premium tests of the same subject to take
// next. The moment they are most ready to go further, so it sells there.
import { useI18n } from 'vue-i18n'
import AppIcon from './AppIcon.vue'
import PremiumPicks from './PremiumPicks.vue'

const props = defineProps({
  percent: { type: Number, required: true },
  tests: { type: Array, required: true },
  subjectKey: { type: String, default: '' },
})
const emit = defineEmits(['close'])
const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[300] flex items-center justify-center p-4" @keydown.esc="emit('close')">
      <div class="absolute inset-0 bg-black/30 backdrop-blur-[2px]" @click="emit('close')"></div>

      <div
        class="relative w-full max-w-[440px] rounded-[28px] bg-app-surface p-6 shadow-app-card"
        role="dialog"
        aria-modal="true"
        :aria-label="t('appShell.nextStep.score', { percent: props.percent })"
      >
        <button
          type="button"
          class="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-app-tile text-app-ink transition-colors hover:bg-app-warm"
          :aria-label="t('common.close')"
          @click="emit('close')"
        >
          <AppIcon name="close" :size="18" />
        </button>

        <div class="text-center">
          <span
            class="app-iris mx-auto flex h-16 w-16 items-center justify-center rounded-full text-[18px] font-semibold text-app-ink ring-4 ring-white shadow-app-card"
          >
            {{ percent }}%
          </span>
          <h2 class="mt-4 text-[20px] font-medium leading-tight tracking-[-0.02em] text-app-ink">
            {{ t('appShell.nextStep.score', { percent }) }}
          </h2>
          <p class="mt-2 text-[14px] leading-[1.6] text-app-ink">
            {{ percent < 60 ? t('appShell.nextStep.lowBody') : t('appShell.nextStep.highBody') }}
          </p>
        </div>

        <PremiumPicks class="mt-5" :tests="tests" @pick="emit('close')" />

        <div class="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            class="rounded-full bg-app-tile px-5 py-2.5 text-[14px] font-medium text-app-ink transition-colors hover:bg-app-warm"
            @click="emit('close')"
          >
            {{ t('appShell.nextStep.later') }}
          </button>
          <RouterLink
            :to="subjectKey ? `/testlar/${subjectKey}` : '/testlar'"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-app-ink px-5 py-2.5 text-[14px] font-medium text-white transition-transform hover:scale-[1.03]"
            @click="emit('close')"
          >
            {{ t('appShell.picks.all') }}
            <AppIcon name="arrowRight" :size="15" />
          </RouterLink>
        </div>
      </div>
    </div>
  </Teleport>
</template>
